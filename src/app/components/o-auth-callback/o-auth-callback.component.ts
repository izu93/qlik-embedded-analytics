import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  templateUrl: './o-auth-callback.component.html',
  styleUrls: ['./o-auth-callback.component.css']
})
export class OAuthCallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      // Extract the token from the query parameters
      const token = params['access_token'];
      if (token) {
        // Store it in sessionStorage (or localStorage)
        sessionStorage.setItem('qlik-access-token', token);
        console.log('Token stored:', token);
      } else {
        console.warn('No access_token found in URL.');
      }
    });
  }
}
