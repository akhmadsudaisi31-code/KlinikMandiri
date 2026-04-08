import { hashPassword } from './src/utils/password';

async function seed() {
    const demoPassword = 'demo12345';
    const hash = await hashPassword(demoPassword);
    
    console.log('-- DEMO ACCOUNTS SEED SQL --');
    console.log(`INSERT INTO clinics (id, name, email, password, status, isAdmin, clinicType) VALUES 
('demo-bidan-clinic', 'Demo Bidan', 'demo.bidan@klinikmandiri.app', '${hash}', 'active', 0, 'Bidan'),
('demo-perawat-clinic', 'Demo Perawat', 'demo.perawat@klinikmandiri.app', '${hash}', 'active', 0, 'Perawat'),
('demo-dokter-clinic', 'Demo Dokter', 'demo.dokter@klinikmandiri.app', '${hash}', 'active', 0, 'Dokter'),
('demo-dokter-gigi-clinic', 'Demo Dokter Gigi', 'demo.drg@klinikmandiri.app', '${hash}', 'active', 0, 'Dokter');`);
    
    console.log(`INSERT INTO clinics (id, name, email, password, status, isAdmin) VALUES 
('admin-1', 'System Admin', 'sudaisi74@gmail.com', '${hash}', 'active', 1);`);
}

seed();
