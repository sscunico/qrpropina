export type LegalPageSlug = "terminos" | "privacidad" | "seguridad" | "defensa-consumidor";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  slug: LegalPageSlug;
  title: string;
  eyebrow: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const legalContactEmail = "legal@qrpropina.com";
export const securityContactEmail = "seguridad@qrpropina.com";

export const legalPages: LegalPageContent[] = [
  {
    slug: "terminos",
    title: "Términos y condiciones",
    eyebrow: "Uso del servicio",
    summary:
      "Condiciones básicas para usar qrpropina, crear QR, administrar creadores y operar pagos mediante Mercado Pago.",
    updatedAt: "14 de junio de 2026",
    sections: [
      {
        title: "1. Alcance del servicio",
        paragraphs: [
          "qrpropina es una plataforma web para generar enlaces y códigos QR de propinas, administrar perfiles de creadores y facilitar pagos a través de proveedores externos como Mercado Pago.",
          "qrpropina no es un banco, entidad financiera, billetera virtual ni procesador de pagos. Las operaciones de pago, acreditación, contracargos, medios de pago y validaciones antifraude son procesadas por Mercado Pago bajo sus propios términos."
        ]
      },
      {
        title: "2. Usuarios, creadores y administradores",
        bullets: [
          "El administrador gestiona la configuración general, comisiones, creadores, QR y datos operativos.",
          "El creador administra sus datos visibles, sus QR y su integración con Mercado Pago cuando corresponda.",
          "La persona que paga una propina accede a un enlace público y no necesita crear una cuenta en qrpropina.",
          "Para crear o administrar una cuenta se debe contar con capacidad legal suficiente y datos veraces."
        ]
      },
      {
        title: "3. Cuenta y acceso",
        paragraphs: [
          "El acceso al panel se realiza mediante autenticación con Google. Cada usuario es responsable de mantener segura su cuenta de Google, sus dispositivos y cualquier sesión iniciada.",
          "qrpropina puede suspender o limitar el acceso cuando detecte uso indebido, datos falsos, intentos de fraude, actividad abusiva o incumplimiento de estas condiciones."
        ]
      },
      {
        title: "4. QR, enlaces públicos y datos visibles",
        paragraphs: [
          "Cada QR apunta a una URL pública de qrpropina. El creador debe revisar que su nombre visible, actividad, lugar y datos asociados sean correctos antes de compartir o imprimir el QR.",
          "Los IDs de QR deben ser únicos y no pueden usarse para suplantar identidades, inducir a error, infringir derechos de terceros o publicar contenido ilegal."
        ]
      },
      {
        title: "5. Pagos, comisiones y acreditación",
        paragraphs: [
          "Cuando un creador conecta su cuenta de Mercado Pago mediante OAuth, qrpropina puede crear preferencias de pago usando esa cuenta y aplicar la comisión de plataforma configurada cuando el proveedor lo permita.",
          "La acreditación, el estado final del pago y la disponibilidad de fondos dependen de Mercado Pago. En qrpropina un pago se considera cobrado solo cuando el estado recibido sea approved.",
          "Los modos demo, pruebas locales o preferencias no aprobadas no implican transferencia real de dinero."
        ]
      },
      {
        title: "6. Uso permitido",
        bullets: [
          "No se debe usar qrpropina para actividades ilegales, fraudulentas, discriminatorias o que infrinjan derechos de terceros.",
          "No se debe intentar vulnerar la seguridad del servicio, automatizar abusivamente solicitudes o interferir con la infraestructura.",
          "No se debe publicar información falsa, engañosa o que pueda confundir al pagador sobre quien recibe la propina."
        ]
      },
      {
        title: "7. Disponibilidad y cambios",
        paragraphs: [
          "qrpropina puede modificar funcionalidades, comisiones, integraciones o estas condiciones para mejorar el servicio, cumplir requisitos legales o adaptarse a cambios de proveedores.",
          "Se procurará mantener el servicio disponible, pero pueden existir interrupciones por mantenimiento, fallas técnicas, problemas de terceros o fuerza mayor."
        ]
      },
      {
        title: "8. Consultas",
        paragraphs: [
          `Para consultas sobre estos términos, escribí a ${legalContactEmail}.`
        ]
      }
    ]
  },
  {
    slug: "privacidad",
    title: "Privacidad y datos personales",
    eyebrow: "Datos personales",
    summary:
      "Cómo recopilamos, usamos, protegemos y compartimos datos personales dentro de qrpropina.",
    updatedAt: "14 de junio de 2026",
    sections: [
      {
        title: "1. Datos que podemos tratar",
        bullets: [
          "Datos de login de Google: nombre, email, foto de perfil e identificadores técnicos necesarios para iniciar sesión.",
          "Datos del creador: nombre visible, alias público, actividad, lugar, foto, QR creados y estado de la cuenta.",
          "Datos de Mercado Pago: alias, identificador de usuario, tokens OAuth cifrados, estado de integración y datos necesarios para crear preferencias de pago.",
          "Datos de propinas: monto, moneda, comisión, estado, referencia externa, ID de preferencia, ID de pago y respuestas técnicas del proveedor de pagos.",
          "Datos técnicos: cookies de sesión, registros basicos de operación, errores, fecha y hora de eventos."
        ]
      },
      {
        title: "2. Para que usamos los datos",
        bullets: [
          "Crear y administrar cuentas de usuarios y creadores.",
          "Generar QR y enlaces públicos de propina.",
          "Crear preferencias de pago y consultar estados de pago mediante Mercado Pago.",
          "Calcular comisiónes, mostrar saldos aprobados y mantener registros operativos.",
          "Prevenir fraude, abuso, accesos no autorizados y problemas de seguridad.",
          "Responder consultas, reclamos o solicitudes legales."
        ]
      },
      {
        title: "3. Datos visibles para terceros",
        paragraphs: [
          "La página pública de propina puede mostrar el nombre visible del creador, actividad, lugar, foto o iniciales y el ID del QR. No se pública el email de login ni tokens de integración.",
          "La persona que paga puede ver datos del creador para identificar a quien envia la propina."
        ]
      },
      {
        title: "4. Proveedores y cesiones",
        paragraphs: [
          "Para prestar el servicio podemos compartir datos estrictamente necesarios con proveedores como Google para autenticación, Mercado Pago para pagos, hosting, infraestructura, soporte técnico o autoridades competentes cuando corresponda.",
          "No vendemos datos personales. No almacenamos datos completos de tarjetas ni credenciales bancarias; esos datos son procesados por Mercado Pago."
        ]
      },
      {
        title: "5. Conservacion",
        paragraphs: [
          "Conservamos los datos mientras la cuenta este activa o mientras sean necesarios para operar el servicio, responder reclamos, cumplir obligaciones legales, prevenir fraude o mantener respaldos razonables.",
          "En entornos locales de prueba, la información puede guardarse en archivos internos del proyecto. En producción debe usarse una base de datos administrada con backups y controles adecuados."
        ]
      },
      {
        title: "6. Derechos de los titulares",
        paragraphs: [
          "Las personas pueden solicitar acceso, rectificación, actualización o supresión de sus datos personales cuando corresponda.",
          `Para ejercer estos derechos, escribí a ${legalContactEmail} indicando tu nombre, email asociado y detalle de la solicitud.`
        ]
      },
      {
        title: "7. Seguridad y confidencialidad",
        paragraphs: [
          "Aplicamos medidas técnicas y organizativas razonables para proteger los datos, incluyendo sesiónes con cookies HttpOnly, cifrado de tokens sensibles, controles de acceso por rol y uso de HTTPS en producción.",
          "Ninguna medida es absoluta. Por eso recomendamos proteger el acceso a Google y Mercado Pago, revisar los QR antes de publicarlos y reportar actividad sospechosa."
        ]
      },
      {
        title: "8. Autoridad de control",
        paragraphs: [
          "En Argentina, la Agencia de Acceso a la Informacion Publica es la autoridad de aplicacion de la Ley N 25.326 de Protección de Datos Personales."
        ]
      }
    ]
  },
  {
    slug: "seguridad",
    title: "Política de seguridad",
    eyebrow: "Protección de cuentas y pagos",
    summary:
      "Buenas prácticas, controles y canales para proteger cuentas, QR, integraciones y operaciones de propina.",
    updatedAt: "14 de junio de 2026",
    sections: [
      {
        title: "1. Principios de seguridad",
        bullets: [
          "Los accesos administrativos requieren autenticación con Google.",
          "Los roles separan permisos de administrador y creador.",
          "Los tokens sensibles de Mercado Pago se guardan cifrados cuando el creador conecta su cuenta.",
          "Los pagos se procesan en Mercado Pago; qrpropina no solicita ni guarda números completos de tarjeta.",
          "En producción se debe operar siempre con HTTPS y variables de entorno seguras."
        ]
      },
      {
        title: "2. Cómo reconocer un enlace seguro",
        bullets: [
          "Verifica que el dominio sea qrpropina.com antes de iniciar sesión o administrar datos.",
          "No ingreses credenciales de Google o Mercado Pago en páginas que no pertenezcan a esos proveedores.",
          "Antes de imprimir un QR, escanealo y confirma que apunte al creador correcto.",
          "Desconfiá de mensajes que pidan tokens, claves, códigos de verificación o cambios urgentes de cuenta."
        ]
      },
      {
        title: "3. Recomendaciones para creadores",
        bullets: [
          "Activa medidas de seguridad en Google y Mercado Pago.",
          "No compartas tu sesión ni permitas que terceros administren tu cuenta sin autorizacion.",
          "Revisa periódicamente tus QR activos y elimina los que ya no uses.",
          "Reporta de inmediato cualquier QR falso, cobro desconocido o acceso sospechoso."
        ]
      },
      {
        title: "4. Reporte de incidentes",
        paragraphs: [
          `Si detectás una vulnerabilidad, intento de phishing, QR falso o acceso no autorizado, escribí a ${securityContactEmail}.`,
          "Incluí URL afectada, captura si corresponde, fecha aproximada, usuario o creador involucrado y una descripción clara del problema."
        ]
      },
      {
        title: "5. Alcance de Mercado Pago",
        paragraphs: [
          "Las validaciones del medio de pago, prevención de fraude financiero, contracargos, autenticación del comprador y acreditación de fondos se gestionan dentro del ecosistema de Mercado Pago.",
          "qrpropina usa notificaciones de pago para actualizar estados locales, pero el estado definitivo del pago depende del proveedor."
        ]
      }
    ]
  },
  {
    slug: "defensa-consumidor",
    title: "Defensa del consumidor",
    eyebrow: "Reclamos y consultas",
    summary:
      "Canales y criterios para consultas relacionadas con propinas, pagos, QR incorrectos o datos de creadores.",
    updatedAt: "14 de junio de 2026",
    sections: [
      {
        title: "1. Antes de pagar",
        bullets: [
          "Verifica que la página muestre el nombre del creador correcto.",
          "Confirma el monto antes de continuar al checkout.",
          "Si el QR parece alterado, roto o sospechoso, no pagues y avisa al local o al creador."
        ]
      },
      {
        title: "2. Consultas sobre pagos",
        paragraphs: [
          "Para revisar una propina, necesitamos datos que permitan identificarla: fecha aproximada, monto, creador, email del pagador si fue informado, ID de pago de Mercado Pago o comprobante.",
          "Si el problema corresponde al medio de pago, contracargo, tarjeta, billetera o acreditación, puede ser necesario gestionarlo también desde Mercado Pago."
        ]
      },
      {
        title: "3. Reclamos sobre datos o identidad",
        paragraphs: [
          "Si un creador, QR o perfil usa datos incorrectos, imágenes no autorizadas o genera confusión sobre quien recibe la propina, podes reportarlo para revisión.",
          `Escribi a ${legalContactEmail} con la URL del QR o perfil y el motivo del reclamo.`
        ]
      },
      {
        title: "4. Respuesta y seguimiento",
        paragraphs: [
          "Intentaremos responder las consultas en un plazo razonable, priorizando casos de seguridad, pagos duplicados, QR falsos o uso indebido de identidad.",
          "Podemos solicitar información adicional para verificar la operación y proteger a creadores, pagadores y administradores."
        ]
      },
      {
        title: "5. Organismos públicos",
        paragraphs: [
          "Los usuarios conservan los derechos que les correspondan bajo la normativa aplicable, incluyendo canales de defensa del consumidor y proteccion de datos personales."
        ]
      }
    ]
  }
];

export function getLegalPage(slug: string) {
  return legalPages.find((page) => page.slug === slug) || null;
}
