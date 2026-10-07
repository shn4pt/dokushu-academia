import type { ComponentType } from 'react'

export type QuizQuestion = {
  question: string
  choices: string[]
  answer: number
  explanation: string
}

export type LessonContent = {
  Body: ComponentType
  quiz: QuizQuestion[]
}
