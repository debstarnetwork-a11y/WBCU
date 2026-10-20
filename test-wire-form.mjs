import { JSDOM } from 'jsdom';

console.log('Testing Wire Form submission in JSDOM...');

JSDOM.fromURL('http://localhost:3000/pages/dashboard.html', {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true
}).then(dom => {
  const { window } = dom;

  window.addEventListener('error', (e) => {
    console.error('>>> [PAGE WINDOW ERROR]:', e.message, e.filename, e.lineno, e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('>>> [UNHANDLED REJECTION]:', e.reason);
  });

  // Polyfills
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.scrollTo = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {}, fillRect: () => {}, strokeRect: () => {}, beginPath: () => {},
    closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
    fillText: () => {}, measureText: () => ({ width: 10 }), scale: () => {}, roundRect: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} })
  });

  setTimeout(() => {
    console.log('Checking DOM setup after 3s...');
    const doc = window.document;

    // Set demo storage user
    const demoUser = {
      id: 'wb-usr-y4rfbph',
      fullName: 'DEBELU EMMANUEL',
      email: 'debeluemmanuel@gmail.com',
      username: 'debeluemmanuel',
      status: 'active',
      kycStatus: 'verified',
      accounts: [
        { id: 'acct-usd-wb-usr-y4rfbph', accountNumber: '9482-1049-55', name: 'US Dollar Vault', currency: 'USD', balance: 100000, available: 100000, isPrimary: true }
      ],
      wireTransferCodes: {
        COT: { code: 'CT-26985', active: true },
        TAX: { code: 'TX-50308', active: true },
        IMF: { code: 'IMF-16483', active: true },
        AML: { code: 'AML-12087', active: true },
        PAP: { code: 'PAP-38560', active: true },
        OTP: { code: '139791', active: true }
      }
    };
    window.localStorage.setItem('wb_credit_union_active_user', JSON.stringify(demoUser));
    window.localStorage.setItem('wbcu_user_profile_v1', JSON.stringify(demoUser));

    const wireForm = doc.getElementById('mainWireTransferForm');
    console.log('wireForm exists?', Boolean(wireForm));

    if (wireForm) {
      const amountInput = doc.getElementById('wirePageAmount');
      const swiftInput = doc.getElementById('wirePageSwiftCode');
      const benInput = doc.getElementById('wirePageBeneficiaryName');
      const ibanInput = doc.getElementById('wirePageIban');
      const bankInput = doc.getElementById('wirePageBankName');
      const countryInput = doc.getElementById('wirePageCountry');
      const bankAddrInput = doc.getElementById('wirePageBankAddress');
      const submitBtn = doc.getElementById('btnInitiateWire') || doc.getElementById('btnInitiateWireTransfer');

      if (amountInput) amountInput.value = '15000';
      if (swiftInput) swiftInput.value = 'BARCGB22';
      if (benInput) benInput.value = 'Apex Global Ltd';
      if (ibanInput) ibanInput.value = 'GB29BUKB20201555992810';
      if (bankInput) bankInput.value = 'Barclays Bank PLC';
      if (countryInput) countryInput.value = 'United Kingdom';
      if (bankAddrInput) bankAddrInput.value = '1 Churchill Place';

      console.log('submitBtn exists?', Boolean(submitBtn));

      if (submitBtn) {
        console.log('Submitting wireForm via requestSubmit / dispatchEvent...');
        window.addEventListener('error', (e) => console.error('WINDOW ERROR:', e.error || e.message));
        try {
          const ev = new window.Event('submit', { cancelable: true, bubbles: true });
          wireForm.dispatchEvent(ev);
        } catch (e) {
          console.error('Submit trigger error:', e);
        }

        setTimeout(() => {
          const wireCodeModal = doc.getElementById('wireCodeModal');
          console.log('wireCodeModal exists?', Boolean(wireCodeModal));
          console.log('wireCodeModal is-active?', wireCodeModal?.classList.contains('is-active'));
          console.log('wireCodeModal display:', wireCodeModal?.style.display);
          console.log('wireStepCounter text:', doc.getElementById('wireStepCounter')?.textContent);
          console.log('codeStepTitle text:', doc.getElementById('codeStepTitle')?.textContent);
          process.exit(0);
        }, 500);
      } else {
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }, 3500);
}).catch(err => {
  console.error('JSDOM load error:', err);
  process.exit(1);
});
