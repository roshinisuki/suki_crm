import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';


const prisma = new PrismaClient();

async function mockSendReset(email) {
  const genericResponse = {
    success: true,
    message: "If an account exists with this email, a reset link has been sent.",
  };

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, isActive: true },
    });

    if (!user) {
      console.log("User not found or not active.");
      return genericResponse;
    }

    if (user.userType === "customer") {
      const customerRecord = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });
      if (!customerRecord || customerRecord.status !== "Active") {
        console.log("Customer record not active or missing.");
        return genericResponse;
      }
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: "PASSWORD_RESET" },
      process.env.JWT_SECRET || "fallback",
      { expiresIn: '15m' }
    );

    console.log("Token generated, updating user...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    console.log("User updated. Simulating sendEmail...");
    // Assuming sendEmail works.
    console.log("Simulating logAudit...");
    
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        module: "AUTH",
        action: "RESET_LINK_SENT",
        details: `Password reset link sent to ${user.email}`
      }
    });

    console.log("Success!");
    return genericResponse;
  } catch (error) {
    console.error("sendPasswordResetLink error:", error);
    return genericResponse;
  }
}

mockSendReset("roshinivenkatesan2610@gmail.com")
  .then(() => prisma.$disconnect());
