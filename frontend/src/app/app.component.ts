import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { QuillModule } from 'ngx-quill';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Quill from 'quill';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, EditorModule, FormsModule, RouterOutlet, QuillModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  isBrowser: boolean;

  // TinyMCE State
  tinyContent = '<p>TinyMCE Content...</p>';

  // Quill State
  quillContent = '<p>Quill Content...</p>';
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link', 'image', 'video']                         // link and image, video
    ],
    imageResize: {}
  };

  tinyInit: any = {
    height: 500,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar:
      'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | link image | print preview media fullscreen | ' +
      'forecolor backcolor emoticons | help',

    base_url: '/tinymce',
    suffix: '.min',

    // Custom Image Upload Handler
    images_upload_handler: (blobInfo: any) => {
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());

      return new Promise((resolve, reject) => {
        this.http.post('http://localhost:3000/upload', formData).subscribe({
          next: (res: any) => resolve(res.location),
          error: (err) => reject('Upload failed: ' + err.message)
        });
      });
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      const ImageResize = (await import('quill-image-resize-module')).default;
      Quill.register('modules/imageResize', ImageResize);
    }
  }

  saveTinyPdf() {
    this.http.post('http://localhost:3000/pdf', { html: this.tinyContent }, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tinymce-content.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }, error => {
        console.error('PDF generation failed', error);
        alert('Failed to generate PDF');
      });
  }

  saveQuillPdf() {
    const data = document.getElementById('quill-editor-container');
    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgWidth = 208; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;

        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const position = 0;

        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save('quill-content.pdf');
      });
    }
  }
}
