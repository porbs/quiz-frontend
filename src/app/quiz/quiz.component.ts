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
          this.addTrueFalseQuestionForm(task._id);
          break;
        case 'one-from-four-question':
          console.log('Building one-from-four question form');
          this.addOneFromFourQuestionForm(task._id);
          break;
        case 'n-from-four-question':
          console.log('Building n-from-four question form');
          this.addNFromFourQuestionForm(task._id);
          break;
        case 'number-question':
          console.log('Building number question form');
          this.addNumberQuestionForm(task._id);
          break;
        case 'word-question':
          console.log('Building word question form');
          this.addWordQuestionForm(task._id);
          break;
        case 'interval-question':
          console.log('Building interval question form');
          this.addIntervalQuestionForm(task._id);
          break;
        default:
          console.log(`Unknown question type: ${task.type}`);
          break;
      }
    });
  }

  private addTrueFalseQuestionForm(id: string) {
    this.taskForms = this.quizForm.get('taskForms') as FormArray;
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['true-false-question', Validators.required],
      value: ['', Validators.required]
    }));
  }

  private addOneFromFourQuestionForm(id: string) {
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['one-from-four-question', Validators.required],
      value: ['', Validators.required]
    }));
  }

  private addNFromFourQuestionForm(id: string) {
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['n-from-four-question', Validators.required],
      value: ['']
    }));
  }

  private addNumberQuestionForm(id: string) {
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['number-question', Validators.required],
      value: ['', Validators.required]
    }));
  }

  private addWordQuestionForm(id: string) {
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['word-question', Validators.required],
      value: ['', Validators.required]
    }));
  }

  private addIntervalQuestionForm(id: string) {
    this.taskForms.push(this.formBuilder.group({
      id: [id, Validators.required],
      type: ['interval-question', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required]
    }));
  }

  onSubmit() {
    if (this.quizForm.invalid) {
      alert('Error: Uncompleted form');
      return;
    }
    const formValues: Array<any> = this.quizForm.get('taskForms').value;
    const data: {_id: string, answer: any}[] = [];

    formValues.forEach(formItem => {
      switch (formItem.type) {
        case 'true-false-question':
          data.push({
            _id: formItem.id,
            answer: {
              value: formItem.value === 'true'
            }
          });
          break;
        case 'one-from-four-question':
          data.push({
            _id: formItem.id,
            answer: {
              value: formItem.value
            }
          });
          break;
        case 'n-from-four-question':
          data.push({
            _id: formItem.id,
            answer: (formItem.value as Array<string>).map(item => ({value: item}))
          });
          break;
        case 'number-question':
          data.push({
            _id: formItem.id,
            answer: {
              value: +formItem.value
            }
          });
          break;
        case 'word-question':
          data.push({
            _id: formItem.id,
            answer: {
              value: formItem.value
            }
          });
          break;
        case 'interval-question':
          data.push({
            _id: formItem.id,
            answer: {
              value: {
                from: +formItem.from,
                to: +formItem.to
              }
            }
          });
          break;
        default:
          console.error(`Unknown question type: ${formItem.type}`);
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
        this.score = `${score.toFixed(2)} / ${result.length.toFixed(2)} (${Math.round(score * 100 / result.length)}%)`;
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
