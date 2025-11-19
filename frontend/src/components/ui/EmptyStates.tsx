'use client';

import React from 'react';
import { 
  PlusIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  BeakerIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-[var(--spotify-light-text)]">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-[var(--spotify-white)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--spotify-light-text)] mb-6 max-w-md">
        {description}
      </p>
      <div className="flex items-center space-x-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-[var(--spotify-green)] text-black font-semibold rounded-full hover:scale-105 transition-transform flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{actionLabel}</span>
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-6 py-3 bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)] font-semibold rounded-full hover:bg-[var(--spotify-border-gray)] transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Empty Questions State
export function EmptyQuestionsState({ onAddQuestion }: { onAddQuestion: () => void }) {
  return (
    <EmptyState
      icon={<QuestionMarkCircleIcon className="w-16 h-16" />}
      title="No research questions yet"
      description="Start by defining your main research question. Break it down into sub-questions to organize your investigation."
      actionLabel="Add Research Question"
      onAction={onAddQuestion}
    />
  );
}

// Empty Hypotheses State
export function EmptyHypothesesState({ onAddHypothesis }: { onAddHypothesis: () => void }) {
  return (
    <EmptyState
      icon={<LightBulbIcon className="w-16 h-16" />}
      title="No hypotheses yet"
      description="Add hypotheses to test your assumptions and track supporting or contradicting evidence."
      actionLabel="Add Hypothesis"
      onAction={onAddHypothesis}
    />
  );
}

// Empty Evidence State
export function EmptyEvidenceState({ onLinkEvidence }: { onLinkEvidence: () => void }) {
  return (
    <EmptyState
      icon={<DocumentTextIcon className="w-16 h-16" />}
      title="No evidence linked"
      description="Link papers from your collections to this question or hypothesis to build your evidence base."
      actionLabel="Link Evidence"
      onAction={onLinkEvidence}
    />
  );
}

// Empty Collections State
export function EmptyCollectionsState({ onCreateCollection }: { onCreateCollection: () => void }) {
  return (
    <EmptyState
      icon={<FolderIcon className="w-16 h-16" />}
      title="No collections yet"
      description="Create collections to organize your papers by topic, methodology, or any other criteria."
      actionLabel="Create Collection"
      onAction={onCreateCollection}
    />
  );
}

// Empty Papers State
export function EmptyPapersState({ onExplorePapers }: { onExplorePapers: () => void }) {
  return (
    <EmptyState
      icon={<DocumentTextIcon className="w-16 h-16" />}
      title="No papers yet"
      description="Start exploring papers related to your research question. Add them to collections for easy access."
      actionLabel="Explore Papers"
      onAction={onExplorePapers}
    />
  );
}

// Empty Protocols State
export function EmptyProtocolsState({ onExtractProtocol }: { onExtractProtocol: () => void }) {
  return (
    <EmptyState
      icon={<BeakerIcon className="w-16 h-16" />}
      title="No protocols extracted"
      description="Extract experimental protocols from papers to replicate methods in your lab."
      actionLabel="Extract Protocol"
      onAction={onExtractProtocol}
    />
  );
}

// Empty Experiments State
export function EmptyExperimentsState({ onPlanExperiment }: { onPlanExperiment: () => void }) {
  return (
    <EmptyState
      icon={<BeakerIcon className="w-16 h-16" />}
      title="No experiments planned"
      description="Plan experiments based on your hypotheses and extracted protocols. Track progress and results."
      actionLabel="Plan Experiment"
      onAction={onPlanExperiment}
    />
  );
}

export default EmptyState;

