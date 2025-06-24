import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { sql } from "@vercel/postgres"

export const runtime = "edge"

const secret = process.env.JWT_SECRET || "oursecret"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("token")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { value } = token

    const decodedToken = verify(value, secret)

    //@ts-ignore
    const user = decodedToken

    const userDataResult = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin
      FROM users 
      WHERE id = ${user.id}
      LIMIT 1
    `

    if (userDataResult.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const userData = userDataResult.rows[0]

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        company: userData.company,
        plan: userData.plan,
        createdAt: userData.created_at,
        isAdmin: userData.is_admin || false,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
