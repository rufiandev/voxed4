import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { createUrl } from '../helpers/functions';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) { }

  async getSession(): Promise<string> {
    await this.verifySession();
    return localStorage.getItem('session');
  }

  setSession(session: string) {
    localStorage.setItem('session', session)
  }

  async verifySession() {
    if (this.isSessionSetted())
      return;

    const session = await this.http.post(createUrl('session'), {}).toPromise();
    this.setSession(session.toString());
  }

  isSessionSetted = () => !!localStorage.getItem('session');
}
