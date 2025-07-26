import { splitProps, type ComponentProps } from 'solid-js';
import { cn } from './utils.js';

export interface CardProps extends ComponentProps<'div'> {}

export function Card(props: CardProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <div
      class={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        local.class
      )}
      {...others}
    />
  );
}

export interface CardHeaderProps extends ComponentProps<'div'> {}

export function CardHeader(props: CardHeaderProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <div
      class={cn('flex flex-col space-y-1.5 p-6', local.class)}
      {...others}
    />
  );
}

export interface CardTitleProps extends ComponentProps<'h3'> {}

export function CardTitle(props: CardTitleProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <h3
      class={cn('text-2xl font-semibold leading-none tracking-tight', local.class)}
      {...others}
    />
  );
}

export interface CardDescriptionProps extends ComponentProps<'p'> {}

export function CardDescription(props: CardDescriptionProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <p
      class={cn('text-sm text-muted-foreground', local.class)}
      {...others}
    />
  );
}

export interface CardContentProps extends ComponentProps<'div'> {}

export function CardContent(props: CardContentProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <div
      class={cn('p-6 pt-0', local.class)}
      {...others}
    />
  );
}

export interface CardFooterProps extends ComponentProps<'div'> {}

export function CardFooter(props: CardFooterProps) {
  const [local, others] = splitProps(props, ['class']);
  
  return (
    <div
      class={cn('flex items-center p-6 pt-0', local.class)}
      {...others}
    />
  );
}