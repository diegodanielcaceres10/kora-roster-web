import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from '../auth/auth';
import { makeCredential, provideFakeGoogle } from '../auth/testing';
import { Entitlements } from './entitlements';

async function setup() {
  const google = provideFakeGoogle();
  TestBed.configureTestingModule({ providers: google.providers });
  const auth = TestBed.inject(Auth);
  const entitlements = TestBed.inject(Entitlements);
  await auth.renderButton(document.createElement('div'));
  return {
    auth,
    entitlements,
    signIn: () => google.fake.pick(makeCredential()),
  };
}

describe('Entitlements', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  describe('the plan', () => {
    it('is "anonymous" for somebody who is not signed in', async () => {
      const { entitlements } = await setup();
      expect(entitlements.plan()).toBe('anonymous');
    });

    it('is "free" once they sign in, and goes back when they sign out', async () => {
      const { entitlements, auth, signIn } = await setup();
      signIn();
      expect(entitlements.plan()).toBe('free');
      await auth.signOut();
      expect(entitlements.plan()).toBe('anonymous');
    });
  });

  describe('how many teams the plan allows', () => {
    it('is 2 without an account and 4 with one', async () => {
      const { entitlements, signIn } = await setup();
      expect(entitlements.maxTeams()).toBe(2);
      signIn();
      expect(entitlements.maxTeams()).toBe(4);
    });
  });

  describe('the lock on a number of teams', () => {
    it.each([
      [1, null],
      [2, null],
      [3, 'sign-in'],
      [4, 'sign-in'],
      [5, 'premium'],
      [6, 'premium'],
      [7, 'premium'],
    ])('without an account, %i teams: %s', async (count, expected) => {
      const { entitlements } = await setup();
      expect(entitlements.teamsLock(count)).toBe(expected);
    });

    it.each([
      [2, null],
      [3, null],
      [4, null],
      [5, 'premium'],
      [6, 'premium'],
      [7, 'premium'],
    ])('with an account, %i teams: %s', async (count, expected) => {
      const { entitlements, signIn } = await setup();
      signIn();
      expect(entitlements.teamsLock(count)).toBe(expected);
    });

    it('asks for Premium, not for an account, from 5 teams on, because an account is not enough', async () => {
      const { entitlements } = await setup();
      expect(entitlements.teamsLock(5)).toBe('premium');
    });

    it('is up to date for whoever reads it inside a computed value', async () => {
      const { entitlements, signIn } = await setup();
      const three = TestBed.runInInjectionContext(() => computed(() => entitlements.teamsLock(3)));
      expect(three()).toBe('sign-in');
      signIn();
      expect(three()).toBeNull();
    });
  });

  describe('the lock on the story image', () => {
    it('asks for an account when there is none, and is open with one', async () => {
      const { entitlements, signIn } = await setup();
      expect(entitlements.storyImageLock()).toBe('sign-in');
      signIn();
      expect(entitlements.storyImageLock()).toBeNull();
    });
  });
});
