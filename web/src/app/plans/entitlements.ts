import { computed, inject, Injectable } from '@angular/core';
import { Auth } from '../auth/auth';

export type Plan = 'anonymous' | 'free';

// Why something is closed: the person has no account, or it is a Premium feature.
export type LockReason = 'sign-in' | 'premium';

const MAX_TEAMS: Record<Plan, number> = { anonymous: 2, free: 4 };

// The one place that knows what each plan can do. Screens ask it and never compare plans
// themselves. It only gates what the screen offers: without a server it can be bypassed,
// and from MVP 4 the server decides.
@Injectable({ providedIn: 'root' })
export class Entitlements {
  private readonly auth = inject(Auth);

  readonly plan = computed<Plan>(() => (this.auth.user() ? 'free' : 'anonymous'));
  readonly maxTeams = computed(() => MAX_TEAMS[this.plan()]);

  // Beyond what a free account allows it is always Premium: an account alone would not help.
  teamsLock(count: number): LockReason | null {
    if (count <= MAX_TEAMS.anonymous) return null;
    if (count <= MAX_TEAMS.free) return this.plan() === 'anonymous' ? 'sign-in' : null;
    return 'premium';
  }

  storyImageLock(): LockReason | null {
    return this.accountLock();
  }

  manualLock(): LockReason | null {
    return this.accountLock();
  }

  // Going on to review the list, and with it to edit the teams, needs an account.
  reviewLock(): LockReason | null {
    return this.accountLock();
  }

  // What is open to any account, free or Premium, and closed to somebody who is not signed in.
  private accountLock(): LockReason | null {
    return this.plan() === 'anonymous' ? 'sign-in' : null;
  }
}
