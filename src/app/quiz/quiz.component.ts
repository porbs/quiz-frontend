import { Component, OnInit } from '@angular/core';
import {ApiService} from '../services/api/api.service';
import {Task} from '../models/task.model';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  tasks: Task[] = [];
  quizForm: FormGroup;
  taskForms: FormArray;
  isLoading = true;
  resultReady = false;
  score = '';
  separator = '!@#s&**&^%$';

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.getTasks();
  }

  private getTasks(): void {
    this.api.getTasks().subscribe(
      (data: Task[]) => {
        this.tasks = data;
        this.buildQuizForm();
      },
      error => {
        console.error('Get tasks error occurred: ', error);
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  private buildQuizForm(): void {
    this.quizForm = this.formBuilder.group({
      taskForms: this.formBuilder.array([])
    });

    this.tasks.forEach(task => {
      switch (task.type) {
        case 'true-false-question':
          console.log('Building true-false question form');
          this.addTrueFalseQuestionForm();
          break;
        case 'one-from-four-question':
          console.log('Building one-from-four question form');
          this.addOneFromFourQuestionForm();
          break;
        case 'n-from-four-question':
          console.log('Building n-from-four question form');
          this.addNFromFourQuestionForm(task.question.options);
          break;
        default:
          console.log(`Unknown question type: ${task.type}`);
          break;
      }
    });
  }

  private addTrueFalseQuestionForm() {
    this.taskForms = this.quizForm.get('taskForms') as FormArray;
    this.taskForms.push(this.formBuilder.group({
      value: ['', Validators.required]
    }));
  }

  private addOneFromFourQuestionForm() {
    this.taskForms.push(this.formBuilder.group({
      value: ['', Validators.required]
    }));
  }

  private addNFromFourQuestionForm(options: Array<{value: string}>) {
    this.taskForms.push(this.formBuilder.group({
      value: ['']
    }));
  }

  private parseSingleFormValue(formValue: string): {index: number, value: string} | undefined {
    const result = formValue.split(this.separator);
    if (result.length !== 2) {
      console.error(`Invalid form value: ${formValue}`);
      return;
    }
    return {
      index: +result[0],
      value: result[1]
    };
  }

  private parseMultipleFormValues(formValues: Array<string>): {index: number, value: Array<string>} | undefined {
    let result: {index: number, value: Array<string>} = {};
    formValues.forEach(formValue => {
      const parsedItem = this.parseSingleFormValue(formValue);
      if (parsedItem === undefined) {
        console.error(`Parse error: ${formValue}`);
        return;
      }
      if (result.index === undefined) {
        result.index = parsedItem.index;
        result.value = [parsedItem.value];
      } else {
        result.value.push(parsedItem.value);
      }
    });
    return result;
  }

  onSubmit() {
    if (this.quizForm.invalid) {
      alert('Error: Uncompleted form');
      return;
    }

    const formValues: Array<{value: string}> = this.quizForm.get('taskForms').value;
    const data: {_id: string, answer: any}[] = [];

    formValues.forEach(formItem => {
      let parsedItem: {index: number, value: any};

      if (typeof(formItem.value) === 'string') {
        parsedItem = this.parseSingleFormValue(formItem.value);
      } else if (Array.isArray(formItem.value)) {
        parsedItem = this.parseMultipleFormValues(formItem.value);
      }

      if (parsedItem === undefined) {
        console.error(`Parse error: ${formItem}`);
        return;
      }

      switch (this.tasks[parsedItem.index].type) {
        case 'true-false-question':
          data.push({
            _id: this.tasks[parsedItem.index]._id,
            answer: {
              value: parsedItem.value === 'true'
            }
          });
          break;
        case 'one-from-four-question':
          data.push({
            _id: this.tasks[parsedItem.index]._id,
            answer: {
              value: parsedItem.value
            }
          });
          break;
        case 'n-from-four-question':
          data.push({
            _id: this.tasks[parsedItem.index]._id,
            answer: parsedItem.value.map(item => ({value: item}))
          });
          break;
        default:
          console.error(`Unknown question type: ${this.tasks[parsedItem.index].type}`);
          return;
      }
    });

    this.isLoading = true;
    this.api.submitTasks(data).subscribe(
      (result: Array<{_id: string, mark: number}>) => {
        let score = 0.0;
        result.forEach(item => {
          score += item.mark;
        });
        this.score = `${score} / ${result.length} (${Math.round(score * 100 / result.length)}%)`;
        this.resultReady = true;
        console.log(result);
      },
      error => {
        console.error('Submit tasks error occurred: ', error);
      },
      () => {
        this.isLoading = false;
      }
    );

  }
}
