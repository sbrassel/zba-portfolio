import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { StudentProfile, Skill, Project, Grade, DossierDocument, DossierSection } from './types';

// ========== DESIGN CONSTANTS ==========
const COLORS = {
  primary: { r: 30, g: 55, b: 153 },
  black: { r: 33, g: 37, b: 41 },
  gray700: { r: 73, g: 80, b: 87 },
  gray600: { r: 108, g: 117, b: 125 },
  gray400: { r: 173, g: 181, b: 189 },
  gray200: { r: 233, g: 236, b: 239 },
  gray100: { r: 245, g: 247, b: 250 },
  white: { r: 255, g: 255, b: 255 },
  success: { r: 25, g: 135, b: 84 },
  danger: { r: 220, g: 53, b: 69 },
};

const toRgb = (c: { r: number; g: number; b: number }) => [c.r, c.g, c.b] as [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const SIDEBAR_W = 52;

// ========== HELPER ==========

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ========== SEITE 1: LEBENSLAUF ==========

export async function generateCoverPage(profile: StudentProfile): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  const sidebarX = MARGIN;
  const sidebarEndX = MARGIN + SIDEBAR_W;
  const mainX = sidebarEndX + 6;
  const mainW = PAGE_W - MARGIN - mainX;
  
  // SIDEBAR
  doc.setFillColor(...toRgb(COLORS.gray100));
  doc.rect(0, 0, sidebarEndX + 2, PAGE_H, 'F');
  
  let sideY = 15;
  
  // Foto
  const photoR = 14;
  const photoX = sidebarX + SIDEBAR_W / 2;
  doc.setFillColor(...toRgb(COLORS.primary));
  doc.circle(photoX, sideY + photoR, photoR, 'F');
  
  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.white));
  doc.text(initials, photoX, sideY + photoR + 4, { align: 'center' });
  
  sideY += photoR * 2 + 8;
  
  // Name
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text(profile.name, sidebarX, sideY);
  sideY += 6;
  
  // KONTAKT
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('KONTAKT', sidebarX, sideY);
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.4);
  doc.line(sidebarX, sideY + 1, sidebarX + 15, sideY + 1);
  sideY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...toRgb(COLORS.black));
  
  const contact = ['076 222 13 44', 'frodo.beutlin@stud.edubs.ch', 'Hobbitonalley 1, 4056 Mittelerde', '', '26.10.2007', 'Hobbit (Schutzstatus S)'];
  contact.forEach(c => {
    if (c) {
      const lines = doc.splitTextToSize(c, SIDEBAR_W - 2);
      doc.text(lines, sidebarX, sideY);
      sideY += lines.length * 3;
    } else {
      sideY += 2;
    }
  });
  sideY += 4;
  
  // SKILLS
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('EDV-KENNTNISSE', sidebarX, sideY);
  doc.line(sidebarX, sideY + 1, sidebarX + 15, sideY + 1);
  sideY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  
  const skills = [
    { name: 'MS Word', level: 85 },
    { name: 'MS Excel', level: 75 },
    { name: '10-Finger', level: 70 },
    { name: 'Python', level: 40 },
  ];
  
  skills.forEach(skill => {
    doc.setFontSize(7);
    doc.text(skill.name, sidebarX, sideY);
    const barW = SIDEBAR_W - 2;
    const barH = 2.5;
    doc.setFillColor(...toRgb(COLORS.gray200));
    doc.rect(sidebarX, sideY + 1, barW, barH, 'F');
    doc.setFillColor(...toRgb(COLORS.primary));
    doc.rect(sidebarX, sideY + 1, barW * (skill.level / 100), barH, 'F');
    sideY += 7;
  });
  sideY += 2;
  
  // SPRACHEN
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('SPRACHEN', sidebarX, sideY);
  doc.line(sidebarX, sideY + 1, sidebarX + 15, sideY + 1);
  sideY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  
  const langs = [
    { name: 'Deutsch', level: 'Muttersprache' },
    { name: 'Russisch', level: 'B1' },
    { name: 'Elbisch', level: 'A2-B1' },
    { name: 'Englisch', level: 'A2' },
  ];
  
  langs.forEach(l => {
    doc.setFontSize(7);
    doc.text(l.name, sidebarX, sideY);
    doc.setTextColor(...toRgb(COLORS.gray600));
    doc.text(l.level, sidebarX + SIDEBAR_W - 2, sideY, { align: 'right' });
    doc.setTextColor(...toRgb(COLORS.black));
    sideY += 4;
  });
  sideY += 4;
  
  // ZERTIFIKATE
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('ZERTIFIKATE', sidebarX, sideY);
  doc.line(sidebarX, sideY + 1, sidebarX + 15, sideY + 1);
  sideY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  doc.setFontSize(6.5);
  doc.text('• ECDL (Word, Excel)', sidebarX, sideY);
  sideY += 3.5;
  doc.text('• TELC Deutsch B1', sidebarX, sideY);
  sideY += 6;
  
  // SOFT SKILLS
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('SOFT SKILLS', sidebarX, sideY);
  doc.line(sidebarX, sideY + 1, sidebarX + 15, sideY + 1);
  sideY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  doc.setFontSize(6.5);
  
  const softSkills = ['Teamfähigkeit', 'Selbstorganisation', 'Flexibilität', 'Ausdauer', 'Kritikfähigkeit'];
  softSkills.forEach(s => {
    doc.text(`• ${s}`, sidebarX, sideY);
    sideY += 3.5;
  });
  
  // HAUPTBEREICH
  let mainY = 15;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text('BEWERBUNGSDOSSIER', mainX, mainY);
  
  mainY += 6;
  
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text(profile.name.toUpperCase(), mainX, mainY);
  
  mainY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text(`Angehende/r ${profile.jobTargets?.[0] || 'Mediamatiker:in EFZ'}`, mainX, mainY);
  
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.6);
  doc.line(mainX, mainY + 2, mainX + 40, mainY + 2);
  
  mainY += 10;
  
  // PROFIL
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('PROFIL', mainX, mainY);
  mainY += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  doc.setFontSize(8);
  
  const bio = profile.bio || 'Hoch motiviert und bestrebt, mich weiterzuentwickeln. Fördere meine Fähigkeiten durch Schach, Sprachen lernen und Fitness-Training.';
  const bioLines = doc.splitTextToSize(bio, mainW);
  doc.text(bioLines, mainX, mainY);
  mainY += bioLines.length * 3.5 + 4;
  
  const addInfoRow = (label: string, value: string) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.gray700));
    doc.text(label, mainX, mainY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.black));
    const lines = doc.splitTextToSize(value, mainW - 22);
    doc.text(lines, mainX + 22, mainY);
    mainY += Math.max(lines.length * 3, 3.5) + 1.5;
  };
  
  addInfoRow('Stärken:', (profile.strengths || ['Ausdauer', 'Zuverlässigkeit', 'Reflexionsfähigkeit']).join(', '));
  addInfoRow('Interessen:', (profile.interests || ['Natur', 'Storytelling', 'Fotografie']).join(', '));
  addInfoRow('Werte:', (profile.values || ['Verantwortung', 'Respekt', 'Durchhalten']).join(', '));
  
  mainY += 5;
  
  // AUSBILDUNG
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('AUSBILDUNG', mainX, mainY);
  mainY += 5;
  
  const education = [
    { period: '08/2025 – heute', title: 'Zentrum für Brückenangebote', place: 'Basel, BS' },
    { period: '04/2022 – 06/2024', title: 'Expeditions-Erfahrung', place: 'Mordor (Teamwork)' },
    { period: '09/2012 – 02/2024', title: 'Hobbitschule', place: 'Hobbiton' },
  ];
  
  const tlX = mainX + 1.5;
  doc.setDrawColor(...toRgb(COLORS.gray400));
  doc.setLineWidth(0.25);
  doc.line(tlX, mainY, tlX, mainY + education.length * 13 - 4);
  
  education.forEach((edu, i) => {
    doc.setFillColor(...toRgb(i === 0 ? COLORS.primary : COLORS.gray400));
    doc.circle(tlX, mainY + 1, 1.2, 'F');
    
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.gray600));
    doc.text(edu.period, mainX + 6, mainY);
    
    mainY += 3.5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.black));
    doc.text(edu.title, mainX + 6, mainY);
    
    mainY += 3;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.gray600));
    doc.setFontSize(7);
    doc.text(edu.place, mainX + 6, mainY);
    
    mainY += 6.5;
  });
  
  mainY += 3;
  
  // BERUFSZIELE
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('BERUFSZIELE', mainX, mainY);
  mainY += 4;
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  
  const goals = profile.jobTargets || ['Mediamatiker:in EFZ', 'Kaufmann/Kauffrau EFZ'];
  goals.forEach((g, i) => {
    doc.text(`${i + 1}. ${g}`, mainX + 3, mainY);
    mainY += 4;
  });
  
  mainY += 5;
  
  // REFERENZEN
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('REFERENZEN', mainX, mainY);
  mainY += 4;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.black));
  doc.text('Dürket Inag, Lehrerin am ZBA', mainX + 3, mainY);
  mainY += 3.5;
  doc.text('Samuel Brassel, Lehrer am ZBA', mainX + 3, mainY);
  
  // Footer
  doc.setDrawColor(...toRgb(COLORS.gray400));
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  doc.setFontSize(6.5);
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text('frodo.beutlin@stud.edubs.ch | 076 222 13 44', MARGIN, PAGE_H - 6);
  doc.text('Seite 1', PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  
  return doc.output('arraybuffer');
}

// ========== SEITE 2: KOMPETENZSPIDER + NOTEN (EINE SEITE, VOLLE BREITE) ==========

const CONTENT_W = PAGE_W - 2 * MARGIN; // 186mm

export async function generateProfilePage(
  profile: StudentProfile,
  skills: Skill[],
  grades?: Grade[],
  radarImage?: string
): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Kopfzeile
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text(profile.name, PAGE_W - MARGIN, 10, { align: 'right' });
  doc.text('Seite 2', PAGE_W - MARGIN, 13, { align: 'right' });
  
  let y = 18;
  
  // ========== OBEN: KOMPETENZRASTER (volle Breite) ==========
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('Kompetenzraster', MARGIN, y);
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 2, MARGIN + 35, y + 2);
  
  y += 8;
  
  // Radar zentriert, grösser; Beschreibungen direkt links und rechts daneben
  const radarSize = 78;
  const radarX = MARGIN + (CONTENT_W - radarSize) / 2;
  const gap = 5;
  const leftColW = radarX - MARGIN - gap;
  const rightColX = radarX + radarSize + gap;
  const rightColW = PAGE_W - MARGIN - rightColX;
  
  // Spider zentriert (wenn Bild vorhanden)
  if (radarImage) {
    try {
      const imgData = radarImage.includes(',') ? radarImage.split(',')[1] : radarImage;
      doc.addImage(imgData, 'PNG', radarX, y, radarSize, radarSize);
    } catch {
      doc.setFillColor(...toRgb(COLORS.gray100));
      doc.rect(radarX, y, radarSize, radarSize, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...toRgb(COLORS.gray400));
      doc.text('Kompetenzradar', radarX + radarSize / 2, y + radarSize / 2, { align: 'center' });
    }
  }
  
  // Erklärungen ohne 8/10 – links und rechts direkt neben dem Radar
  const leftComps = [
    { name: 'Selbstkompetenzen', desc: 'Eigenverantwortung, Zeitmanagement, Reflexion' },
    { name: 'Sprachkompetenzen', desc: 'Ausdruck, Leseverständnis, Textproduktion' },
    { name: 'MINT-Kompetenzen', desc: 'Naturwissenschaften, Technik, Experimentieren' },
  ];
  const rightComps = [
    { name: 'Sozialkompetenzen', desc: 'Teamarbeit, Kommunikation, Konfliktlösung' },
    { name: 'Mathematische Kompetenzen', desc: 'Logik, Rechnen, Problemlösung' },
    { name: 'Digitalkompetenzen', desc: 'IT-Anwendungen, Medienkompetenz' },
  ];
  
  const lineH = 10;
  const blockH = 3 * lineH;
  const textStartY = y + (radarSize - blockH) / 2;
  
  leftComps.forEach((comp, i) => {
    const yRow = textStartY + i * lineH;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.primary));
    doc.text(comp.name, MARGIN, yRow);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.gray700));
    const lines = doc.splitTextToSize(comp.desc, leftColW - 1);
    doc.text(lines[0] || '', MARGIN, yRow + 4);
  });
  
  rightComps.forEach((comp, i) => {
    const yRow = textStartY + i * lineH;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.primary));
    doc.text(comp.name, rightColX, yRow);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.gray700));
    const lines = doc.splitTextToSize(comp.desc, rightColW - 1);
    doc.text(lines[0] || '', rightColX, yRow + 4);
  });
  
  y += radarSize + 6;
  
  // Trennlinie
  doc.setDrawColor(...toRgb(COLORS.gray200));
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;
  
  // ========== UNTEN: NOTEN (volle Breite, chic) ==========
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text('Semesterzeugnis', MARGIN, y);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text('Schuljahr 2025/2026 · 1. Semester', MARGIN + 38, y);
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 2, MARGIN + 32, y + 2);
  
  y += 8;
  
  const displayGrades = grades?.length ? grades : [
    { subject: 'Deutsch', value: 4.5, type: 'Semester', date: 'Jan 26' },
    { subject: 'Mathematik', value: 4.0, type: 'Semester', date: 'Jan 26' },
    { subject: 'Englisch', value: 4.0, type: 'Semester', date: 'Jan 26' },
    { subject: 'Allgemeinbildung', value: 4.5, type: 'Semester', date: 'Jan 26' },
    { subject: 'Informatik / Medien', value: 5.0, type: 'Semester', date: 'Jan 26' },
    { subject: 'Projektarbeit', value: 5.5, type: 'Semester', date: 'Jan 26' },
    { subject: 'Arbeitstechniken', value: 5.0, type: 'Semester', date: 'Jan 26' },
    { subject: 'Sport', value: 5.5, type: 'Semester', date: 'Jan 26' },
  ] as Grade[];
  
  // Tabellen-Header (volle Breite)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.gray700));
  doc.text('Fachbereich', MARGIN, y);
  doc.text('Note', PAGE_W - MARGIN - 12, y, { align: 'right' });
  y += 2;
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  
  const rowH = 6;
  displayGrades.forEach((grade, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(...toRgb(COLORS.gray100));
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, 'F');
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...toRgb(COLORS.black));
    doc.text(grade.subject, MARGIN, y);
    let noteColor = COLORS.primary;
    if (grade.value >= 5.5) noteColor = COLORS.success;
    else if (grade.value < 4) noteColor = COLORS.danger;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(noteColor));
    doc.text(grade.value.toFixed(1), PAGE_W - MARGIN, y, { align: 'right' });
    doc.setDrawColor(...toRgb(COLORS.gray200));
    doc.setLineWidth(0.15);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    y += rowH;
  });
  
  y += 4;
  doc.setDrawColor(...toRgb(COLORS.gray700));
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  
  const avg = displayGrades.reduce((s, g) => s + g.value, 0) / displayGrades.length;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...toRgb(COLORS.black));
  doc.text('Durchschnitt', MARGIN, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(...toRgb(avg >= 5 ? COLORS.success : avg < 4 ? COLORS.danger : COLORS.primary));
  doc.text(avg.toFixed(2), PAGE_W - MARGIN, y + 5, { align: 'right' });
  
  y += 14;
  
  // Unterschriften (volle Breite nutzen)
  doc.setDrawColor(...toRgb(COLORS.gray400));
  doc.setLineWidth(0.25);
  const sigW = 50;
  doc.line(MARGIN, y, MARGIN + sigW, y);
  doc.line(PAGE_W - MARGIN - sigW, y, PAGE_W - MARGIN, y);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text('Klassenlehrperson', MARGIN, y + 4);
  doc.text('Schulleitung', PAGE_W - MARGIN - sigW, y + 4);
  doc.circle(PAGE_W / 2, y - 6, 7, 'S');
  doc.setFontSize(5);
  doc.setTextColor(...toRgb(COLORS.gray400));
  doc.text('Stempel', PAGE_W / 2, y - 4, { align: 'center' });
  
  // Footer
  doc.setDrawColor(...toRgb(COLORS.gray200));
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  doc.setFontSize(6.5);
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text(`Basel, ${new Date().toLocaleDateString('de-CH')}`, MARGIN, PAGE_H - 6);
  doc.text('Zentrum für Brückenangebote Basel', PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  
  return doc.output('arraybuffer');
}

// ========== PROJEKT ==========

export async function generateProjectPage(project: Project): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;
  
  doc.setFontSize(6.5);
  doc.setTextColor(...toRgb(COLORS.gray600));
  doc.text('Projektdokumentation', PAGE_W - MARGIN, 10, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(...toRgb(COLORS.primary));
  doc.text(`Projekt: ${project.title}`, MARGIN, y);
  
  const statusMap: Record<string, string> = { completed: 'Abgeschlossen', active: 'In Bearbeitung', planning: 'Planung' };
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...toRgb(project.status === 'completed' ? COLORS.success : COLORS.gray600));
  doc.text(`[${statusMap[project.status] || project.status}]`, MARGIN + doc.getTextWidth(`Projekt: ${project.title}`) * 0.43 + 3, y);
  
  y += 3;
  doc.setDrawColor(...toRgb(COLORS.primary));
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, MARGIN + 25, y);
  y += 6;
  
  if (project.passionQuestion) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.gray700));
    doc.text('Leitfrage:', MARGIN, y);
    y += 3.5;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...toRgb(COLORS.black));
    const qLines = doc.splitTextToSize(project.passionQuestion, PAGE_W - 2 * MARGIN);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * 3.5 + 4;
  }
  
  if (project.milestones?.length) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...toRgb(COLORS.gray700));
    doc.text('Meilensteine:', MARGIN, y);
    y += 4;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    project.milestones.forEach(m => {
      doc.setTextColor(...toRgb(m.completed ? COLORS.success : COLORS.gray600));
      doc.text(`${m.completed ? '☑' : '☐'} ${m.text}`, MARGIN + 2, y);
      y += 4;
    });
  }
  
  doc.setDrawColor(...toRgb(COLORS.gray400));
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  
  return doc.output('arraybuffer');
}

// ========== NOTEN (Standalone - für Rückwärtskompatibilität) ==========

export async function generateGradesPage(grades: Grade[]): Promise<ArrayBuffer> {
  // Nutzt jetzt die kombinierte Seite
  const dummyProfile: StudentProfile = {
    name: 'Frodo Beutlin',
    class: 'ZBA 1A',
    zbaProfile: 'Integration',
  };
  const dummySkills: Skill[] = [];
  return generateProfilePage(dummyProfile, dummySkills, grades);
}

// ========== PDF MERGE ==========

export interface MergeOptions {
  sections: DossierSection[];
  documents: DossierDocument[];
  profile: StudentProfile;
  skills: Skill[];
  projects: Project[];
  grades: Grade[];
  selectedProjectIds?: string[];
  competencyRadarImage?: string;
}

export async function mergeDossier(options: MergeOptions): Promise<Uint8Array> {
  const { sections, documents, profile, skills, projects, grades, selectedProjectIds, competencyRadarImage } = options;
  const mergedPdf = await PDFDocument.create();

  const sortedSections = [...sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    try {
      let pdfBytes: ArrayBuffer | Uint8Array | null = null;

      if (section.type === 'uploaded') {
        const doc = documents.find(d => d.id === section.sourceId);
        if (doc?.pdfData) {
          pdfBytes = base64ToArrayBuffer(doc.pdfData);
        }
      } else {
        switch (section.sectionType) {
          case 'cover':
            pdfBytes = await generateCoverPage(profile);
            break;
          case 'profile':
            // Eine Seite: Kompetenzspider + Erklärungen + Noten (Radar-Bild wird mit übergeben)
            pdfBytes = await generateProfilePage(profile, skills, grades, competencyRadarImage);
            break;
          case 'competencyRadar':
            // Keine eigene Seite – Spider erscheint auf der Profil-Seite (oben)
            continue;
          case 'projects':
            const projectsToInclude = selectedProjectIds
              ? projects.filter(p => selectedProjectIds.includes(p.id))
              : projects.filter(p => p.status === 'completed' || p.status === 'active');

            for (const project of projectsToInclude) {
              const projectPdf = await generateProjectPage(project);
              const srcDoc = await PDFDocument.load(projectPdf);
              const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
            }
            continue;
          case 'grades':
            // Grades sind jetzt in profile integriert, skip wenn profile aktiv
            const hasProfile = sortedSections.some(s => s.enabled && s.sectionType === 'profile');
            if (!hasProfile) {
              pdfBytes = await generateGradesPage(grades);
            }
            continue;
        }
      }

      if (pdfBytes) {
        const srcDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
    } catch (error) {
      console.error(`Fehler bei Sektion ${section.label}:`, error);
    }
  }

  return mergedPdf.save();
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
