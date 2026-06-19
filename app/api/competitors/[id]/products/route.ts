import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const competitor = await prisma.competitor.findFirst({ where: { id, companyId: user.companyId } });
  if (!competitor) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  const products = await prisma.competitorProduct.findMany({
    where: { competitorId: id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!["Admin", "SalesManager"].includes(user.role ?? "")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const competitor = await prisma.competitor.findFirst({ where: { id, companyId: user.companyId } });
  if (!competitor) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });

  const product = await prisma.competitorProduct.create({
    data: {
      competitorId: id,
      name: body.name,
      description: body.description || null,
      priceRange: body.priceRange || null,
      ourAdvantage: body.ourAdvantage || null,
    },
  });

  return NextResponse.json({ success: true, data: product });
}
