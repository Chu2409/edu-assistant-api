import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'
import { isYoutubeUrl } from '../transcription/utils/youtube-url.util'

export function IsYoutubeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isYoutubeUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isYoutubeUrl(value)
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultMessage(_args: ValidationArguments): string {
          return 'url must be a valid YouTube URL'
        },
      },
    })
  }
}
