import dotenv from 'dotenv';
import {UsersService} from '../../../src/app/services/firebase/interactable/users.service';
import {firstValueFrom} from 'rxjs';

dotenv.config();

export class NotificationService {
  private transporter;
  private userService;
  private nodemailer: any;

  constructor() {
    this.transporter = this.nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env['GMAIL_USER'],
        pass: process.env['GMAIL_PASS'],
      },
    });

    this.userService = new UsersService;
  }

  async sendMail(userId: string, subject: string, text: string) {
    try {
      const userRecord = await firstValueFrom(this.userService.get(userId));

      if (userRecord.email) {
        const mailOptions = {
          from: process.env['GMAIL_USER'],
          to: userRecord.email,
          subject,
          text,
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${userRecord.email}`);
      } else {
        console.error(`El usuario con ID ${userId} no tiene un email registrado.`);
      }
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  }

  async updateNotificationStatus(userId: string, enabled: boolean): Promise<boolean> {
    try {
      await this.userService.updateNotifications(userId, enabled);
      return true;
    } catch (error) {
      console.error('Error actualizando el estado de notificación:', error);
      return false;
    }
  }
}
