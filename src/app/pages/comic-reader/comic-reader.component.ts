import {Component, OnInit, ElementRef, ViewChild, Input, SimpleChanges, OnChanges, Optional} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../app.service';
import * as pdfjsLib from 'pdfjs-dist';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CommentsSectionComponent } from '../../components/comments-section/comments-section.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {ActionIconsComponent} from '../../components/action-icons/action-icons.component';
import {ButtonComponent} from '../../components/button/button.component';
import {TranslateModule} from '@ngx-translate/core';
import {NgIf} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {UserStoreService} from '../../../../backend/src/services/user-store';

@Component({
  selector: 'app-comic-reader',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    CommentsSectionComponent,
    TranslateModule,
    NgIf
  ],
  templateUrl: './comic-reader.component.html',
  styleUrl: './comic-reader.component.scss'
})
export class ComicReaderComponent implements OnInit, OnChanges {
  @Input() pdfUrl: string = "../../assets/COMIC castellano WEB_ok.pdf";
  title: string = '';
  comments: Comment[] = [];
  status: string =  'Unknown';
  rating: number = 0;
  comicId: string = '';
  currentUserId: string = '';
  private destroy$ = new Subject<void>();
  pdfLoaded:boolean=false;
  @ViewChild('pdfCanvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfContainter', { static: true }) pdfContainter!: ElementRef<HTMLDivElement>;

  @ViewChild('InputNumber', { static: false }) inputNumber!: ElementRef<HTMLInputElement>;
  private pdfDocument: any = null;
  maxPages = 0;
  InputNumber: number = 0;
  protected pageNumber: number = 1;
  scale = 0;

  constructor(
    private route: ActivatedRoute,
    private appService: AppService,
    private snackBar:MatSnackBar,
    private userStoreService: UserStoreService

  )
  {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../../assets/pdf.worker.mjs';
  }

  async ngOnInit(): Promise<void> {
    const comicId = this.route.snapshot.paramMap.get('id');
    this.userStoreService.getUser().subscribe(user=>{
      this.currentUserId = user?.id ||"";
    })
    if (comicId) {
      this.comicId = comicId;
      this.loadComicData(comicId);
      this.pdfUrl = await this.appService.getComicUrl(comicId);
      console.log('PDF URL:', this.pdfUrl);
    }
    if(this.currentUserId){
        this.appService.getSaveComicPage(this.currentUserId,this.comicId).then(Number=>{
          if (Number !== undefined && Number !== null) {
            this.pageNumber =  Number;
          } else {
            this.pageNumber = 1;
          }
        })
    }
    if (this.pdfUrl) {
      this.loadPdf();
    }

  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfUrl'] && !changes['pdfUrl'].firstChange) {
      this.loadPdf();
    }
  }

  loadComicData(comicId: string): void {
    this.appService.getComicById(comicId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (comic) => {
        if (comic) {
          this.title = comic.title || 'Untitled Comic';
          this.comments = comic.comments || [];
          this.status = comic.state || 'Unknown';
          this.rating = comic.rating || 0;
        }
      },
      error: (err) => {
        console.error('Error loading comic:', err);
      }
    });
  }

  async loadPdf(): Promise<void> {
    try {
      this.pdfDocument = await pdfjsLib.getDocument(this.pdfUrl).promise;
      this.maxPages = this.pdfDocument.numPages;
      await this.renderPage(this.pageNumber);
    } catch (error) {
      console.error('Error al cargar el PDF:', error);
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument) return;

    try {
      const page = await this.pdfDocument.getPage(pageNumber);

      const container = this.pdfContainter.nativeElement;
      const scale = container.clientWidth / page.getViewport({ scale: 2.45 }).width;

      const viewport = page.getViewport({ scale });
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error al renderizar la página:', error);
    }
  }

  async nextPage(): Promise<void> {
    if (this.pageNumber < this.pdfDocument.numPages) {
      this.pageNumber++;
      this.renderPage(this.pageNumber);
    }
  }

  async prevPage(): Promise<void> {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.renderPage(this.pageNumber);
    }
  }

  pageInputChange(): void {
    this.InputNumber = parseInt(this.inputNumber.nativeElement.value);
    if (this.InputNumber > this.maxPages) {
      this.inputNumber.nativeElement.value = "";
      this.pageNumber=this.maxPages;
      this.renderPage(this.maxPages);
    } else {
      this.inputNumber.nativeElement.value = "";
      this.pageNumber = this.InputNumber
      this.renderPage(this.InputNumber);
    }
  }

  pageChangeOnClick(evt: MouseEvent, pdfContainter: HTMLDivElement) {
    if (evt.pageX >= pdfContainter.clientWidth/ 2) {
      this.nextPage();
    } else if (evt.pageX <= pdfContainter.clientWidth/ 2) {
      this.prevPage();
    }
  }



  fullscreen(): void {
    const container = this.pdfContainter.nativeElement;
    if (container.requestFullscreen) {
      container.requestFullscreen(({navigationUI: "hide"}));
    } else {
      console.warn("Pantalla completa no es soportada por este navegador.");
    }
  }

  private fullscreenHandler = () => {
    const container = this.pdfContainter.nativeElement;
    if (document.fullscreenElement==container) {
      container.classList.add("fullscreen");
      this.renderPage(this.pageNumber)
    }else {
      container.classList.remove("fullscreen");
      this.renderPage(this.pageNumber)
    }
  };

  numberChecker() {
    let number =this.inputNumber.nativeElement.value.replace(/\D/g, '');
    this.inputNumber.nativeElement.value = number;
    }

  SaveComicPage() {
    this.snackBar.open("Pagina Guardada","Cerrar",{duration:2000,panelClass:["pageSaved"]})
    this.appService.saveComicPage(this.pageNumber, this.currentUserId, this.comicId);
  }
}
