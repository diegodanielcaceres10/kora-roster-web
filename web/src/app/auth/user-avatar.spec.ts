import { TestBed } from '@angular/core/testing';
import { AuthUser } from './credential';
import { UserAvatar } from './user-avatar';

const USER: AuthUser = {
  id: '1',
  name: 'diego Cáceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};

function setup(user: AuthUser, size?: number) {
  const fixture = TestBed.createComponent(UserAvatar);
  fixture.componentRef.setInput('user', user);
  if (size !== undefined) fixture.componentRef.setInput('size', size);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('UserAvatar', () => {
  it('shows the photo as decoration, at 32 px by default', () => {
    const img = setup(USER).querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(USER.picture);
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('height')).toBe('32');
  });

  it('does not send the address of the page when it asks for the photo', () => {
    const img = setup(USER).querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('can be bigger', () => {
    const img = setup(USER, 64).querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('width')).toBe('64');
  });

  it('shows the capital initial when there is no photo', () => {
    const el = setup({ ...USER, picture: '' });
    expect(el.querySelector('img')).toBeNull();
    const initial = el.querySelector('span') as HTMLElement;
    expect(initial.textContent?.trim()).toBe('D');
    expect(initial.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    ['  ana', 'A'],
    ['🧤 Keeper', '🧤'],
    ['', '?'],
    ['   ', '?'],
  ])('uses the initial of %j as %j', (name, expected) => {
    const el = setup({ ...USER, name, picture: '' });
    expect(el.querySelector('span')?.textContent?.trim()).toBe(expected);
  });

  it('sizes the initial like the photo', () => {
    const initial = setup({ ...USER, picture: '' }, 48).querySelector('span') as HTMLElement;
    expect(initial.style.width).toBe('48px');
    expect(initial.style.height).toBe('48px');
  });
});
