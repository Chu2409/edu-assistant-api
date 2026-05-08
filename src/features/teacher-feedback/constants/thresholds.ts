/** Mínimo de estudiantes que deben haber interactuado con un LO para generar feedback */
export const MIN_STUDENTS_FOR_LO_FEEDBACK = 1

/** Mínimo de interacciones totales (chat + actividades + feedbacks + preguntas + notas) para generar feedback */
export const MIN_INTERACTIONS_FOR_FEEDBACK = 1

/** Cron: cada semana (en ms) */
export const FEEDBACK_CRON_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000

/** Máximo de mensajes de chat a incluir en el prompt por LO (para no exceder tokens) */
export const MAX_CHAT_MESSAGES_PER_LO = 30

/** Máximo de feedbacks de estudiantes a incluir por LO */
export const MAX_FEEDBACKS_PER_LO = 30

/** Máximo de notas de estudiantes a incluir por LO */
export const MAX_STUDENT_NOTES_PER_LO = 30

/** Máximo de preguntas del foro a incluir por LO */
export const MAX_FORUM_QUESTIONS_PER_LO = 20
