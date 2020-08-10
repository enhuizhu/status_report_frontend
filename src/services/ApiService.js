export class ApiService {
  static getStatusReport() {
    return fetch('http://localhost:4000/reports').then(r => r.json());
  }
}