import {Component, Input, OnInit} from '@angular/core';
import {Chat, Discussion} from '../../models/discussion';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {AppService} from '../../app.service';

@Component({
  selector: 'app-discussion-card',
  templateUrl: './discussion-card.component.html',
  imports: [DatePipe, TranslatePipe],
  styleUrl: './discussion-card.component.scss'
})
export class DiscussionCardComponent implements OnInit{
  @Input() discussion!: Discussion;
  participants !: string;
  date?:string;
  userImg:string|undefined;

  constructor(private router: Router,
              private appService: AppService) {}

  ngOnInit() {
  this.appService.getUserByUid(this.discussion.userId).subscribe(user=>
    this.userImg = user.imageUrl
  )

    this.participants = this.discussion.chatCount.toString()
  }

  onSeeMore() {
    if(this.discussion.id){
      this.router.navigate(['discussion',this.discussion.id]).then(() =>{
        window.scrollTo(0,0);
      });
    }
  }
}
