import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

async function main(): Promise<void> {
  if (environment.mockApi) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
}

main();
