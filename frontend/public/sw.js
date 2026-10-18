// Tidak ada service worker untuk aplikasi ini.
// Fail ini mencegah pelayar mendaftarkan index.html sebagai SW
// (yang berlaku akibat not_found_handling = "single-page-application").

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}