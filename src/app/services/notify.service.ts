import { Injectable } from '@angular/core';
import emailjs from 'emailjs-com';

@Injectable({
  providedIn: 'root',
})
export class NotifyService {
  private serviceId: string = 'service_x2vj84d';
  private templateId: string = 'template_d5uo7lm';
  private userId: string = 'LTcU5WyWMB2g5oZ4B';

  sendNotification(email: string, name: string) {
    const templateParams = {
      name: name,
      email: email,
    };

    emailjs.send(this.serviceId, this.templateId, templateParams, this.userId)
      .then((response) => {
        console.log('Correo enviado exitosamente:', response.status, response.text);
      })
      .catch((error) => {
        console.error('Error al enviar el correo:', error);
      });
  }
}
