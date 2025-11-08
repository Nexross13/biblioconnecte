const nodemailer = require('nodemailer');
const { PRIMARY_FRONTEND_ORIGIN } = require('../config/frontend');

const FRONTEND_BASE = PRIMARY_FRONTEND_ORIGIN.replace(/\/$/, '');

let transporter;

const buildTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_SECURE,
    SMTP_URL,
  } = process.env;

  try {
    if (SMTP_URL) {
      return nodemailer.createTransport(SMTP_URL);
    }

    if (!SMTP_HOST) {
      console.warn('📨  Email service not configured: missing SMTP_HOST or SMTP_URL');
      return null;
    }

    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? Number(SMTP_PORT) : 587,
      secure: SMTP_SECURE ? SMTP_SECURE === 'true' : false,
      auth: SMTP_USER
        ? {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          }
        : undefined,
    });
  } catch (error) {
    console.error('❌  Unable to configure email transporter:', error.message);
    return null;
  }
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }
  transporter = buildTransporter();
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('📨  Email skipped: transporter unavailable');
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!from) {
    console.warn('📨  Email skipped: EMAIL_FROM / SMTP_USER not configured');
    return;
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
  } catch (error) {
    console.error('❌  Failed to send email:', error.message);
  }
};

const buildFriendRequestEmail = ({ addressee, requester, dashboardUrl }) => {
  const fullRequesterName = [requester.firstName, requester.lastName].filter(Boolean).join(' ');
  const subject = `${fullRequesterName} souhaite devenir votre ami sur My BiblioConnect`;
  const actionUrl = dashboardUrl || `${FRONTEND_BASE}/friends`;

  const text = `Bonjour ${addressee.firstName || addressee.email},\n\n${fullRequesterName} vous a envoyé une demande d'ami sur My BiblioConnect.\nPour accepter ou refuser, rendez-vous sur votre espace amis : ${actionUrl}\n\nÀ très vite sur My BiblioConnect !`;

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f1f5f9;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:90%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 24px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;letter-spacing:0.05em;text-transform:uppercase;">My BiblioConnect</h1>
              <p style="margin:12px 0 0;font-size:14px;opacity:0.85;">La communauté qui partage ses coups de cœur</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#0f172a;">
              <p style="margin:0 0 16px;font-size:16px;">Bonjour <strong>${addressee.firstName || addressee.email}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                <strong style="color:#2563eb;">${fullRequesterName}</strong> souhaite rejoindre votre cercle d'amis sur My BiblioConnect. Vous pouvez accepter ou refuser cette invitation depuis votre espace «&nbsp;Amis&nbsp;».
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td>
                    <a href="${actionUrl}" style="display:inline-block;padding:14px 28px;font-weight:600;font-size:15px;color:#ffffff;background:linear-gradient(135deg,#2563eb,#7c3aed);text-decoration:none;border-radius:999px;box-shadow:0 10px 20px rgba(37,99,235,0.35);">
                      Voir mes demandes d'amis
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
                Astuce&nbsp;: profitez-en pour découvrir les dernières lectures de vos amis et enrichir votre propre bibliothèque.
              </p>
              <p style="margin:0;font-size:14px;color:#94a3b8;">À très vite sur My BiblioConnect 💙</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:20px;text-align:center;color:#e2e8f0;font-size:12px;">
              <p style="margin:0 0 6px;">My BiblioConnect • Vos lectures, partout, tout le temps.</p>
              <p style="margin:0;opacity:0.7;">Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, text, html };
};

const sendFriendRequestNotification = async ({ addressee, requester, dashboardUrl }) => {
  if (!addressee?.email) {
    console.warn('📨  Email skipped: addressee email missing');
    return;
  }

  const message = buildFriendRequestEmail({ addressee, requester, dashboardUrl });
  await sendEmail({ to: addressee.email, ...message });
};

const buildFriendAcceptedEmail = ({ requester, addressee, dashboardUrl }) => {
  const addresseeName = [addressee.firstName, addressee.lastName].filter(Boolean).join(' ') || 'Votre ami';
  const subject = `${addresseeName} a accepté votre demande d'ami sur My BiblioConnect`;
  const actionUrl = dashboardUrl || `${FRONTEND_BASE}/friends`;

  const text = `Bonjour ${requester.firstName || requester.email},\n\n${addresseeName} a accepté votre demande d'ami sur My BiblioConnect.\nVous pouvez désormais consulter sa bibliothèque et partager vos lectures.\nAccédez à votre espace amis : ${actionUrl}\n\nBonne lecture sur My BiblioConnect !`;

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f1f5f9;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:90%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 24px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;letter-spacing:0.05em;text-transform:uppercase;">My BiblioConnect</h1>
              <p style="margin:12px 0 0;font-size:14px;opacity:0.85;">Une nouvelle amitié littéraire commence</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#0f172a;">
              <p style="margin:0 0 16px;font-size:16px;">Bonjour <strong>${requester.firstName || requester.email}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                <strong style="color:#2563eb;">${addresseeName}</strong> a accepté votre demande d'ami sur My BiblioConnect.
                Vous pouvez maintenant explorer sa bibliothèque, partager vos coups de cœur et découvrir de nouvelles lectures.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td>
                    <a href="${actionUrl}" style="display:inline-block;padding:14px 28px;font-weight:600;font-size:15px;color:#ffffff;background:linear-gradient(135deg,#2563eb,#7c3aed);text-decoration:none;border-radius:999px;box-shadow:0 10px 20px rgba(37,99,235,0.35);">
                      Voir mes amis
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
                Conseil : pensez à recommander un livre pour célébrer cette nouvelle connexion !
              </p>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Bonne lecture sur My BiblioConnect 💙</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:20px;text-align:center;color:#e2e8f0;font-size:12px;">
              <p style="margin:0 0 6px;">My BiblioConnect • Vos lectures, partout, tout le temps.</p>
              <p style="margin:0;opacity:0.7;">Si vous n'attendiez pas cette notification, vous pouvez ignorer ce message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, text, html };
};

const sendFriendAcceptedNotification = async ({ requester, addressee, dashboardUrl }) => {
  if (!requester?.email) {
    console.warn('📨  Email skipped: requester email missing');
    return;
  }

  const message = buildFriendAcceptedEmail({ requester, addressee, dashboardUrl });
  await sendEmail({ to: requester.email, ...message });
};

const buildProposalDecisionEmail = ({ proposer, proposal, decision, dashboardUrl }) => {
  const proposerName = [proposer.firstName, proposer.lastName].filter(Boolean).join(' ') || proposer.email;
  const bookTitle = proposal.title || 'Votre proposition';
  const isApproved = decision === 'approved';
  const subject = isApproved
    ? `Votre proposition "${bookTitle}" a été approuvée ✨`
    : `Votre proposition "${bookTitle}" nécessite des ajustements`;
  const actionUrl = dashboardUrl || `${FRONTEND_BASE}/`;
  const statusBadgeColor = isApproved ? '#16a34a' : '#dc2626';
  const statusLabel = isApproved ? 'Approuvée' : 'Refusée';
  const summaryText = proposal.summary ? proposal.summary : 'Résumé indisponible';

  const text = isApproved
    ? `Bonjour ${proposerName},\n\nBonne nouvelle ! Votre proposition "${bookTitle}" a été approuvée par l'équipe de My BiblioConnect et sera disponible dans le catalogue.\n\nMerci pour votre contribution et continuez à enrichir la communauté : ${actionUrl}\n\nExtrait du livre : ${summaryText}\n\nÀ très bientôt sur My BiblioConnect !`
    : `Bonjour ${proposerName},\n\nVotre proposition "${bookTitle}" n'a pas été retenue pour le moment.\n${proposal.rejectionReason ? `Motif : ${proposal.rejectionReason}\n` : ''}\n\nN'hésitez pas à apporter quelques ajustements et à la soumettre à nouveau.\n\nRésumé soumis : ${summaryText}\n\nRetrouvez vos propositions sur ${actionUrl}\n\nMerci pour votre engagement sur My BiblioConnect.`;

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f1f5f9;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;width:90%;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 16px 32px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:26px;letter-spacing:0.04em;text-transform:uppercase;">My BiblioConnect</h1>
              <p style="margin:10px 0 0;font-size:15px;opacity:0.85;">Suivi de vos propositions</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#0f172a;line-height:1.6;">
              <p style="margin:0 0 16px;font-size:16px;">Bonjour <strong>${proposerName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;">
                ${isApproved ? 'Bonne nouvelle ! 🎉 Votre proposition a été validée et rejoindra bientôt le catalogue.' : 'Merci pour votre proposition. Après analyse, quelques ajustements sont nécessaires avant publication.'}
              </p>
              <div style="margin:24px 0;padding:20px;border-radius:20px;background-color:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f172a;">${bookTitle}</p>
                <p style="margin:0 0 12px;font-size:13px;color:#475569;">
                  <span style="display:inline-block;padding:4px 12px;border-radius:12px;background-color:${statusBadgeColor}20;color:${statusBadgeColor};font-weight:600;">${statusLabel}</span>
                </p>
                <p style="margin:0 0 12px;font-size:14px;color:#475569;">${summaryText}</p>
                ${proposal.rejectionReason && !isApproved ? `<p style="margin:0;font-size:14px;color:#dc2626;"><strong>Motif :</strong> ${proposal.rejectionReason}</p>` : ''}
              </div>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;">
                ${isApproved
                  ? 'Merci pour votre contribution qui enrichit la communauté. Continuez à partager vos découvertes littéraires !'
                  : 'Nous vous encourageons à réviser votre proposition et à la soumettre à nouveau. Votre enthousiasme fait vivre My BiblioConnect.'}
              </p>
              <p style="margin:24px 0 0;">
                <a href="${actionUrl}" style="display:inline-block;padding:14px 28px;font-weight:600;font-size:15px;color:#ffffff;background:linear-gradient(135deg,#2563eb,#7c3aed);text-decoration:none;border-radius:999px;box-shadow:0 10px 20px rgba(37,99,235,0.35);">
                  Retourner sur My BiblioConnect
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:20px;text-align:center;color:#e2e8f0;font-size:12px;">
              <p style="margin:0 0 6px;">My BiblioConnect • Vos lectures, partout, tout le temps.</p>
              <p style="margin:0;opacity:0.7;">Besoin d’aide ? Contactez l’équipe support depuis votre espace personnel.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, text, html };
};

const sendBookProposalDecisionNotification = async ({ proposer, proposal, decision, dashboardUrl }) => {
  if (!proposer?.email) {
    console.warn('📨  Email skipped: proposer email missing');
    return;
  }

  const message = buildProposalDecisionEmail({ proposer, proposal, decision, dashboardUrl });
  await sendEmail({ to: proposer.email, ...message });
};

const buildAuthorProposalDecisionEmail = ({ proposer, proposal, decision }) => {
  const proposerName = [proposer.firstName, proposer.lastName].filter(Boolean).join(' ') || proposer.email;
  const fullName = `${proposal.firstName} ${proposal.lastName}`.trim();
  const isApproved = decision === 'approved';
  const subject = isApproved
    ? `Votre auteur "${fullName}" a été approuvé ✨`
    : `Votre auteur "${fullName}" nécessite des ajustements`;
  const actionUrl = `${FRONTEND_BASE}/`;
  const badgeColor = isApproved ? '#16a34a' : '#dc2626';
  const badgeLabel = isApproved ? 'Approuvé' : 'Refusé';
  const biographyText = proposal.biography || 'Aucune biographie détaillée n’a été fournie.';

  const text = isApproved
    ? `Bonjour ${proposerName},\n\nBonne nouvelle ! L'auteur "${fullName}" a été approuvé et rejoint la base My BiblioConnect.\n\nRendez-vous sur ${actionUrl} pour suivre vos contributions.\n\nBiographie envoyée : ${biographyText}\n\nMerci pour votre engagement !`
    : `Bonjour ${proposerName},\n\nAprès relecture, l'auteur "${fullName}" n'a pas été validé pour le moment.\n${
        proposal.rejectionReason ? `Motif : ${proposal.rejectionReason}\n\n` : ''
      }Nous vous invitons à ajuster sa présentation avant une nouvelle soumission.\n\nConsultez vos propositions sur ${actionUrl}`;

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8fafc;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;width:90%;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 16px 32px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;letter-spacing:0.04em;text-transform:uppercase;">My BiblioConnect</h1>
              <p style="margin:8px 0 0;font-size:15px;opacity:0.85;">Suivi de vos propositions d'auteurs</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#0f172a;line-height:1.6;">
              <p style="margin:0 0 16px;font-size:16px;">Bonjour <strong>${proposerName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;">
                ${
                  isApproved
                    ? 'Bonne nouvelle ! Votre proposition rejoint le catalogue et sera visible par la communauté.'
                    : 'Merci pour votre proposition. Quelques ajustements sont nécessaires avant validation.'
                }
              </p>
              <div style="margin:24px 0;padding:20px;border-radius:20px;background-color:#eef2ff;border:1px solid #c7d2fe;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#312e81;">${fullName}</p>
                <p style="margin:0 0 12px;font-size:13px;">
                  <span style="display:inline-block;padding:4px 12px;border-radius:12px;background-color:${badgeColor}20;color:${badgeColor};font-weight:600;">${badgeLabel}</span>
                </p>
                <p style="margin:0;font-size:14px;color:#312e81;">${biographyText}</p>
                ${
                  proposal.rejectionReason && !isApproved
                    ? `<p style="margin:12px 0 0;font-size:14px;color:#dc2626;"><strong>Motif :</strong> ${proposal.rejectionReason}</p>`
                    : ''
                }
              </div>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;">
                ${
                  isApproved
                    ? 'Merci de contribuer à faire découvrir de nouveaux talents aux lecteurs.'
                    : 'Mettez à jour la fiche et soumettez à nouveau pour partager ce talent avec la communauté.'
                }
              </p>
              <p style="margin:24px 0 0;">
                <a href="${actionUrl}" style="display:inline-block;padding:14px 28px;font-weight:600;font-size:15px;color:#ffffff;background:linear-gradient(135deg,#2563eb,#7c3aed);text-decoration:none;border-radius:999px;box-shadow:0 10px 20px rgba(37,99,235,0.35);">
                  Accéder au tableau de bord
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:18px;text-align:center;color:#e2e8f0;font-size:12px;">
              <p style="margin:0;">My BiblioConnect • Vos lectures, partout, tout le temps.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, text, html };
};

const sendAuthorProposalDecisionNotification = async ({ proposer, proposal, decision }) => {
  if (!proposer?.email) {
    console.warn('📨  Email skipped: proposer email missing');
    return;
  }

  const message = buildAuthorProposalDecisionEmail({ proposer, proposal, decision });
  await sendEmail({ to: proposer.email, ...message });
};

module.exports = {
  sendEmail,
  sendFriendRequestNotification,
  sendFriendAcceptedNotification,
  sendBookProposalDecisionNotification,
  sendAuthorProposalDecisionNotification,
};
