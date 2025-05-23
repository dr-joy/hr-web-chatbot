'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import type { ModelProvider } from '@/lib/ai/model-config';

const providers = [
  {
    id: 'openai',
    name: 'Template',
    description: 'Use OpenAI models (GPT-4)',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Use local Ollama models',
  },
] as const;

export function ModelProviderSelector({
  selectedProvider,
  className,
}: {
  selectedProvider: ModelProvider;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticProvider, setOptimisticProvider] =
    useOptimistic(selectedProvider);

  const selectedProviderInfo = useMemo(
    () => providers.find((provider) => provider.id === optimisticProvider),
    [optimisticProvider]
  );

  const saveProvider = async (provider: ModelProvider) => {
    try {
      const response = await fetch('/api/config/model-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });
      if (!response.ok) throw new Error('Failed to save provider');
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className
        )}
      >
        <Button
          data-testid="model-provider-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedProviderInfo?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {providers.map((provider) => {
          const { id } = provider;

          return (
            <DropdownMenuItem
              data-testid={`model-provider-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticProvider(id);
                  saveProvider(id);
                });
              }}
              data-active={id === optimisticProvider}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{provider.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {provider.description}
                  </div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
