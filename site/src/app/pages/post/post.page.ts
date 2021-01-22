import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { CommentOptionsComponent } from 'src/app/components/comment-options/comment-options.component';
import { Post } from 'src/app/interfaces/post';
import { AuthService } from 'src/app/services/auth.service';
import { PostService } from 'src/app/services/post.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.page.html',
  styleUrls: ['./post.page.scss'],
})
export class PostPage implements OnInit {
  public postId: string;
  public post: Post = new Post();
  public comments = new Array<any>();
  public commentBtnDisabled = false; // Button is enable.
  public timer: string;
  public imgComment;
  public imgPreview = '../../../assets/anon/anon-1.svg';

  @ViewChild("txtComment") private txtComment: HTMLIonTextareaElement;
  @ViewChild("selMove") private selMove: HTMLIonSelectElement;

  constructor(
    public toastCtrl: ToastController,
    private activatedRoute: ActivatedRoute,
    private title: Title,
    private http: HttpClient,
    private postServ: PostService,
    private authServ: AuthService,
    private alertCtrl: AlertController,
    private sessionServ: SessionService,
    private popoverCtrl: PopoverController) { }

  async ngOnInit() {
    this.postId = this.activatedRoute.snapshot.paramMap.get('postId');
    const postDoc = await this.postServ.getPostById(this.postId).toPromise();
    this.post = postDoc.data() as any;
    this.title.setTitle(this.post.title + ' | Anon Land');
    this.getComments();
  }

  commentTimer() {
    this.commentBtnDisabled = true;

    setTimeout(() => {
      this.commentBtnDisabled = false;
    }, 30000); // Time to wait for comment.

    let timeLeft = 30;
    const commentTime = setInterval(() => {
      timeLeft--;
      this.timer = `Esperar ${timeLeft}s`;
      if (timeLeft === 0) {
        clearInterval(commentTime);
        this.timer = ''; // Disappear timer.
      }
    }, 1000); // Refresh each 1s.
  }

  async comment() {
    const body = this.txtComment.value.replace(/(?:\r\n|\r|\n)/g, '<br>');
    let buttonAlert: string;

    // If comment is void send an alert.
    // Else the timer start.
    switch (body.length) {
      case 0:
        buttonAlert = 'El comentario está vacio.';
        break;
      default:
        buttonAlert = 'Mensaje publicado correctamente.';
        this.commentTimer();
        break;
    }

    let formData = new FormData();
    formData.append('body', body);
    formData.append('post-img-upload', this.imgComment);
    formData.append('postId', this.postId);
    formData.append('userId', this.sessionServ.getSession());

    this.http.post('http://localhost:3000/comment', formData).subscribe(async _ => {
      const toast = await this.toastCtrl.create({
        message: buttonAlert,
        position: 'top',
        duration: 3000
      });
      await toast.present();
    });
  }

  async getComments() {
    const comments = await this.postServ.getComments(this.postId);
    this.comments = comments.docs.map(comment => {
      const commentObj: any = comment.data();
      commentObj.id = comment.id;
      return commentObj;
    })
  }

  async showOptions($event: MouseEvent, commentId: string) {
    $event.stopPropagation();
    const popover = await this.popoverCtrl.create({
      component: CommentOptionsComponent,
      event: $event,
      componentProps: { commentId: commentId }
    });
    await popover.present();
  }

  async deletePost() {
    const alert = await this.alertCtrl.create({
      header: 'Borrar post',
      message: '¿Estas seguro de borrar este post?',
      buttons: [{ text: 'Cancelar', role: 'cancel' }, {
        text: 'Aceptar', handler: async () => {
          await this.postServ.deletePost(this.postId);
          const toast = await this.toastCtrl.create({ header: 'Post borrado correctamente' });
          await toast.present();
        }
      }]
    });

    alert.present();
  }

  deleteComment() {

  }

  async movePost() {
    if (this.selMove.value == null)
      return;

    await this.postServ.movePost(this.postId, this.selMove.value);
    const toast = await this.toastCtrl.create({ header: 'Post movido correctamente' });
    await toast.present();
  }

  async banUser() {
    await this.http.post('http://localhost:3000', { opIP: this.post.opIP }).toPromise();
    const toast = await this.toastCtrl.create({ header: 'Usuario baneado correctamente' });
    await toast.present();
  }

  report() {
    this.http.post('http://localhost:3000/report', { postID: this.post.id }, { responseType: 'text' }).subscribe(async () => {
      const toast = await this.toastCtrl.create({ header: 'Post reportado correctamente', position: 'top' });
      await toast.present();
    });
  }

  onSelectFile(preview: any) {
    if (preview.target.files && preview.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(preview.target.files[0]); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        this.imgComment = preview.target.files[0];
        this.imgPreview = event.target.result.toString();
      };
    }
  }
}