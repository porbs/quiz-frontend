import { Component, OnInit } from '@angular/core';
import {ApiService} from '../services/api/api.service';
import {Task} from '../models/task.model';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';

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

  private parseFormValue(formValue: string): {index: number, value: string} | undefined {
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

  async onSubmit() {
    if (this.quizForm.invalid) {
      alert('Error: Uncompleted form');
      return;
    }

    const formValues: Array<{value: string}> = this.quizForm.get('taskForms').value;
    const data: {_id: string, answer: any}[] = [];

    formValues.forEach(formItem => {
      const parsedItem = this.parseFormValue(formItem.value);
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
