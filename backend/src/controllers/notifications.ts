import { Request, Response } from 'express';
import {NotificationService} from '../services/notification';

const notificationService = new NotificationService();

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const { userId, enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid status format' });
    }

    const result = await notificationService.updateNotificationStatus(userId, enabled);

    if (result) {
      return res.status(200).json({
        message: `Notificaciones ${enabled ? 'activadas' : 'desactivadas'}`,
        status: enabled,
      });
    } else {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error actualizando notificaciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const sendNotificationEmail = async (req: Request, res: Response) => {
  try {
    const { userId, subject, message } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ message: 'Faltan datos necesarios para enviar el correo' });
    }

    await notificationService.sendMail(userId, subject, message);

    return res.status(200).json({
      message: `Correo enviado al usuario ${userId}`,
      status: 'success',
    });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
