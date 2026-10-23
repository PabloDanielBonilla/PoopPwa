import React from 'react';
import { X, ShieldCheck, Scale, AlertTriangle, HelpCircle, FileText, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InfoModalProps {
  type: 'terms' | 'refund' | 'privacy' | 'faq' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  const { t } = useLanguage();

  if (!type) return null;

  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: t('Privacy Policy & Data Protection (GDPR / CCPA)', 'Política de Privacidad y Protección de Datos'),
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-950 dark:text-emerald-300 font-medium">
                <strong>{t('Data Privacy Commitment:', 'Compromiso de Privacidad:')}</strong> {t(
                  'Poop.lol respects your privacy. We strictly adhere to GDPR, CCPA, and international data protection standards.',
                  'Poop.lol respeta tu privacidad. Cumplimos estrictamente con el RGPD (GDPR), CCPA y normativas internacionales de protección de datos.'
                )}
              </div>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  1. {t('Information We Collect', 'Información que Recopilamos')}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>{t('Account Information:', 'Información de Cuenta:')}</strong> {t('Public username, email address, chosen avatar, and country of origin.', 'Nombre de usuario público, correo electrónico, avatar seleccionado y país de origen.')}</li>
                  <li><strong>{t('Activity Records:', 'Registros de Actividad:')}</strong> {t('Poop timestamps, total counts, streaks, room membership, and private-room rankings.', 'Marcas de tiempo de popós, contador total, rachas, pertenencia a salas y clasificaciones privadas de cada sala.')}</li>
                  <li><strong>{t('Sponsor & Ad Data:', 'Datos de Publicidad:')}</strong> {t('Promotional URLs, ad texts, and aggregated click statistics.', 'URLs promocionales, textos de anuncios y estadísticas acumuladas de clics.')}</li>
                  <li><strong>{t('Technical Data:', 'Datos Técnicos:')}</strong> {t('IP address, browser type, device identifiers, and session tokens.', 'Dirección IP, tipo de navegador, identificadores de dispositivo y tokens de sesión.')}</li>
                  <li><strong>{t('Payment Identifiers:', 'Identificadores de Pago:')}</strong> {t('Subscription and transaction IDs processed securely via Polar. We NEVER store raw credit card credentials on our servers.', 'IDs de suscripción y transacción procesados de forma segura vía Polar. NUNCA almacenamos números de tarjeta de crédito en nuestros servidores.')}</li>
                </ul>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  2. {t('How We Use Your Data', 'Uso de la Información')}
                </h4>
                <p>
                  {t(
                    'Your data is processed exclusively to operate private rooms and their rankings, deliver room notifications, verify the optional monthly room subscription, prevent abuse, and calculate aggregate usage statistics.',
                    'Procesamos tus datos exclusivamente para operar salas privadas y sus clasificaciones, enviar notificaciones de sala, verificar la suscripción mensual opcional, prevenir abusos y calcular estadísticas agregadas de uso.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  3. {t('Third-Party Services', 'Servicios de Terceros')}
                </h4>
                <p>
                  {t(
                    'We share necessary data with trusted service providers strictly to deliver core app functionality: Firebase/Google Cloud (database, authentication and push delivery) and Polar (subscription processing).',
                    'Compartimos datos únicamente con proveedores confiables para la entrega del servicio: Firebase/Google Cloud (base de datos, autenticación y envío de notificaciones) y Polar (procesamiento de suscripciones).'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  4. {t('Your Rights (ARCO & GDPR)', 'Tus Derechos (ARCO y RGPD)')}
                </h4>
                <p>
                  {t(
                    'You have the right to access, rectify, export, or permanently delete your account and associated room data (Right to be Forgotten). You can request account deletion at any time by emailing legal@poop.lol.',
                    'Tienes derecho a acceder, rectificar, exportar o eliminar permanentemente tu cuenta y los datos asociados a tus salas (Derecho al Olvido). Puedes solicitar la eliminación de tu cuenta escribiendo a legal@poop.lol.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  5. {t('Legal Contact', 'Contacto Legal')}
                </h4>
                <p className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>privacy@poop.lol / legal@poop.lol</span>
                </p>
              </section>
            </div>
          ),
        };

      case 'terms':
        return {
          title: t('Terms of Service & Legal Notice', 'Términos de Servicio y Aviso Legal'),
          icon: <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 font-medium">
                <strong>{t('Entertainment Notice:', 'Aviso Recreativo:')}</strong> {t(
                  'poop.lol is a satirical entertainment app for private-room poop competitions. It does NOT provide medical or health diagnosis advice.',
                  'poop.lol es una aplicación de entretenimiento para competiciones de popós en salas privadas. NO constituye ni reemplaza asesoramiento médico o de salud.'
                )}
              </div>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  1. {t('Acceptance & Age Eligibility', 'Aceptación y Mayoría de Edad')}
                </h4>
                <p>
                  {t(
                    'By accessing or registering on poop.lol, you accept these Terms in full. Users must be at least 13 years old (or 18 where required for online transactions) or have parental consent.',
                    'Al acceder o registrarte en poop.lol, aceptas estos Términos en su totalidad. Debes tener al menos 13 años (o 18 según la jurisdicción para transacciones financieras) o contar con autorización tutorial.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  2. {t('Ad Regulations & Community Guidelines', 'Normas de Publicidad y Contenido')}
                </h4>
                <p>
                  {t(
                    'Users who set a room decree or sponsor badge must adhere strictly to legal and ethical standards. PROHIBITED CONTENT includes:',
                    'Los usuarios que patrocinen lugares o publiquen mensajes deben cumplir estrictamente con normas éticas y legales. QUEDA STRICTAMENTE PROHIBIDO:'
                  )}
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-red-600 dark:text-red-400">
                  <li>{t('Hate speech, racism, discrimination, or harassment.', 'Discurso de odio, racismo, discriminación o acoso.')}</li>
                  <li>{t('Explicit adult content, pornography, or violence.', 'Contenido pornográfico, explícito o violento.')}</li>
                  <li>{t('Malware, phishing links, scams, or fraudulent URLs.', 'Malware, enlaces de phishing, estafas o sitios engañosos.')}</li>
                  <li>{t('Illegal goods, weapons, or regulated substances.', 'Productos ilegales, armas o sustancias reguladas.')}</li>
                </ul>
                <p className="mt-1.5 text-neutral-600 dark:text-neutral-400 italic">
                  {t(
                    'We reserve the unconditional right to remove infringing links, moderate ad texts, and ban accounts without refund.',
                    'Nos reservamos el derecho incondicional de eliminar enlaces en infracción, moderar textos y suspender cuentas sin derecho a reembolso.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  3. {t('Room Premium Subscription', 'Suscripción Sala Premium')}
                </h4>
                <p>
                  {t(
                    'The only paid product is Room Premium: an optional monthly subscription of $2.99 that lets a private room have unlimited members. It renews automatically each month until canceled. Logging a poop and participating in a free room are always free. You can cancel at any time and keep Premium until the end of the paid period.',
                    'El único producto de pago es Sala Premium: una suscripción mensual opcional de $2.99 que permite miembros ilimitados en una sala privada. Se renueva automáticamente cada mes hasta que la canceles. Registrar un popó y participar en una sala gratuita son siempre gratis. Puedes cancelar en cualquier momento y conservar Premium hasta el final del período pagado.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  4. {t('Fair Play & Account Verification', 'Juego Limpio y Verificación de Cuentas')}
                </h4>
                <p>
                  {t(
                    'Poop.lol utilizes secure verification algorithms. Automated script manipulation or unauthorized code injection will result in automatic disqualification.',
                    'Poop.lol utiliza algoritmos de verificación. La manipulación automatizada con bots o scripts provocará la descalificación inmediata.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  5. {t('Limitation of Liability', 'Limitación de Responsabilidad')}
                </h4>
                <p>
                  {t(
                    'The service is provided "AS IS". Poop.lol is not liable for third-party links published by users in rooms or intermittent internet connectivity disruptions.',
                    'El servicio se proporciona "TAL CUAL". Poop.lol no se hace responsable por el contenido de enlaces de terceros publicados por usuarios en las salas ni por interrupciones de red externas.'
                  )}
                </p>
              </section>
            </div>
          ),
        };

      case 'refund':
        return {
          title: t('Refund & Billing Policy', 'Política de Reembolsos y Facturación'),
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-950 dark:text-red-300">
                <h4 className="font-extrabold text-sm">{t('Strict Non-Refundable Policy', 'Política Estricta de No-Reembolso')}</h4>
                <p className="mt-1">
                  {t(
                    'Room Premium is a recurring monthly subscription. You can cancel at any time; access remains active until the end of the current billing period.',
                    'Sala Premium es una suscripción mensual recurrente. Puedes cancelar en cualquier momento; el acceso se mantiene activo hasta el final del período facturado.'
                  )}
                </p>
              </div>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  1. {t('Instant Fulfillment Execution', 'Ejecución Instantánea del Servicio')}
                </h4>
                <p>
                  {t(
                    'Room Premium unlocks unlimited membership for one room. It is billed monthly through Polar, our merchant of record. Canceling stops future renewals but does not shorten the period already paid for.',
                    'Sala Premium desbloquea miembros ilimitados para una sala. Se factura mensualmente a través de Polar, nuestro comerciante de registro. Cancelar detiene futuras renovaciones pero no acorta el período ya pagado.'
                  )}
                </p>
              </section>

              <section>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm mb-1">
                  2. {t('Duplicate Payment Protocol', 'Protocolo por Pagos Duplicados')}
                </h4>
                <p>
                  {t(
                    'In the rare event of a verified duplicate charge or an unauthorized subscription, contact support@poop.lol with your Polar receipt ID for immediate assistance.',
                    'En el caso excepcional de un cobro duplicado o una suscripción no autorizada, contacta a support@poop.lol enviando tu ID de recibo de Polar.'
                  )}
                </p>
              </section>
            </div>
          ),
        };

      case 'faq':
        return {
          title: t('Frequently Asked Questions (FAQ)', 'Preguntas Frecuentes (FAQ)'),
          icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <div>
                <h4 className="font-extrabold text-neutral-950 dark:text-white">{t('What is poop.lol?', '¿Qué es poop.lol?')}</h4>
                <p className="mt-1">
                  {t(
                    'It is a private-room competition game. You create or join a room, log your poops for free, and see the ranking of that room only.',
                    'Es un juego de competición en salas privadas. Creas o te unes a una sala, registras tus popós gratis y ves solo la clasificación de esa sala.'
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-neutral-950 dark:text-white">{t('Is it free to participate?', '¿Es gratis participar?')}</h4>
                <p className="mt-1">
                  {t(
                    'Yes! Logging a poop is always free. The only optional payment is Room Premium ($2.99/month) for unlimited members in a room.',
                    '¡Sí! Puedes registrar tu actividad de forma 100% gratuita. Los impulsos opcionales te permiten subir rangos, patrocinar puestos y promocionar tu marca.'
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-neutral-950 dark:text-white">{t('How does sponsorship & ad promotion work?', '¿Cómo funcionan los anuncios y patrocinios?')}</h4>
                <p className="mt-1">
                  {t(
                    'If you add a sponsor badge, your website or brand logo, custom text, and direct link can appear alongside your name in your room, accumulating direct clicks.',
                    'Al patrocinar tu puesto, el logotipo de tu web o marca, texto personalizado y enlace directo aparecen junto a tu nombre acumulando clics reales.'
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-neutral-950 dark:text-white">{t('How do I request account deletion?', '¿Cómo solicito la eliminación de mis datos?')}</h4>
                <p className="mt-1">
                  {t(
                    'You can request complete account and data removal directly from your Profile settings or by emailing legal@poop.lol.',
                    'Puedes solicitar la eliminación completa de tu cuenta y datos directamente desde tu Perfil o enviando un correo a legal@poop.lol.'
                  )}
                </p>
              </div>
            </div>
          ),
        };

      default:
        return { title: '', icon: null, body: null };
    }
  };

  const { title, icon, body } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#18181b] text-neutral-950 dark:text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 overflow-y-auto pr-1 flex-1">{body}</div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span className="font-medium text-[11px]">{t('Updated: September 2026', 'Actualizado: Septiembre 2026')}</span>
          <button
            onClick={onClose}
            className="bg-neutral-950 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {t('Understood & Accept', 'Entendido y Aceptar')}
          </button>
        </div>
      </div>
    </div>
  );
};
