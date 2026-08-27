from enum import Enum
from typing import Set

class RunState(str, Enum):
    INGESTED = "ingested"
    AGENT1_DONE = "agent1_done"
    PROCESSING = "processing"          # agents 2+3+4 running
    DRAFT_PENDING_REVIEW = "draft_pending_review"
    REVIEWED_CONFIRMED = "reviewed_confirmed"
    MANUAL_LEGAL_REVIEW = "manual_legal_review"
    FAILED = "failed"


# Valid transition map
ALLOWED_TRANSITIONS: dict[RunState, Set[RunState]] = {
    RunState.INGESTED: {
        RunState.AGENT1_DONE,
        RunState.MANUAL_LEGAL_REVIEW,
        RunState.FAILED,
    },
    RunState.AGENT1_DONE: {
        RunState.PROCESSING,
        RunState.MANUAL_LEGAL_REVIEW,
        RunState.FAILED,
    },
    RunState.PROCESSING: {
        RunState.DRAFT_PENDING_REVIEW,
        RunState.MANUAL_LEGAL_REVIEW,
        RunState.FAILED,
    },
    RunState.DRAFT_PENDING_REVIEW: {
        RunState.REVIEWED_CONFIRMED,
        RunState.MANUAL_LEGAL_REVIEW,
        RunState.FAILED,
    },
    RunState.MANUAL_LEGAL_REVIEW: {
        RunState.DRAFT_PENDING_REVIEW,
        RunState.REVIEWED_CONFIRMED,
        RunState.FAILED,
    },
    RunState.REVIEWED_CONFIRMED: set(),  # Terminal state
    RunState.FAILED: set(),              # Terminal state
}


class InvalidStateTransitionError(Exception):
    def __init__(self, current_state: RunState, target_state: RunState, reason: str = ""):
        message = f"Cannot transition run from '{current_state.value}' to '{target_state.value}'."
        if reason:
            message += f" Reason: {reason}"
        super().__init__(message)
        self.current_state = current_state
        self.target_state = target_state


def validate_transition(current_state: RunState | str, target_state: RunState | str) -> bool:
    """Check if transition between states is allowed according to state machine rules."""
    curr = RunState(current_state)
    target = RunState(target_state)
    
    if target not in ALLOWED_TRANSITIONS.get(curr, set()):
        raise InvalidStateTransitionError(curr, target)
    return True
