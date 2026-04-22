export async function sendEmail({ to, subject, html }) {
  console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
}

export async function sendActivationRequestEmail({ student, approveUrl, rejectUrl }) {
  console.log(`[ACTIVATION REQUEST] ${student.name} (${student.roll_number})`);
  console.log(`  Approve: ${approveUrl}`);
  console.log(`  Reject:  ${rejectUrl}`);
}

export async function sendActivationOutcomeEmail({ student, approved }) {
  console.log(`[ACTIVATION ${approved ? 'APPROVED' : 'REJECTED'}] ${student.name}`);
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  console.log(`[PASSWORD RESET] ${name} | ${to}`);
  console.log(`  Reset URL: ${resetUrl}`);
}