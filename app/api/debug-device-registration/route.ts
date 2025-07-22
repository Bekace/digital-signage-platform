import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get device table structure
    const deviceTableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'devices'
      ORDER BY ordinal_position;
    `

    // Get device pairing codes table structure
    const pairingCodesTableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'device_pairing_codes'
      ORDER BY ordinal_position;
    `

    // Get triggers on devices table
    const deviceTriggers = await sql`
      SELECT trigger_name, action_timing, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'devices';
    `

    // Get triggers on device_pairing_codes table
    const pairingCodeTriggers = await sql`
      SELECT trigger_name, action_timing, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'device_pairing_codes';
    `

    // Test device insert with minimal fields
    const testInsertResult = await sql`
      DO $$
      DECLARE
        test_device_id UUID;
      BEGIN
        -- Insert a test device with minimal fields
        INSERT INTO devices (name, device_type, user_id, status)
        VALUES ('Test Device', 'test_device', '00000000-0000-0000-0000-000000000000', 'offline')
        RETURNING id INTO test_device_id;
        
        -- Delete the test device
        DELETE FROM devices WHERE id = test_device_id;
        
        RAISE NOTICE 'Test device insert successful with ID: %', test_device_id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Test device insert failed: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Test pairing code insert
    const testPairingCodeResult = await sql`
      DO $$
      DECLARE
        test_code_id UUID;
        test_code VARCHAR(6);
      BEGIN
        -- Generate a random code
        test_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Insert a test pairing code
        INSERT INTO device_pairing_codes (code, user_id, expires_at)
        VALUES (test_code, '00000000-0000-0000-0000-000000000000', NOW() + INTERVAL '1 hour')
        RETURNING id INTO test_code_id;
        
        -- Delete the test code
        DELETE FROM device_pairing_codes WHERE id = test_code_id;
        
        RAISE NOTICE 'Test pairing code insert successful with code: %', test_code;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Test pairing code insert failed: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Check for device registration function
    const deviceRegistrationFunction = await sql`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_name LIKE '%device%register%' OR routine_name LIKE '%register%device%';
    `

    // Get the SQL for the register API route
    const registerApiRoute = await sql`
      SELECT * FROM devices LIMIT 0;
    `

    return NextResponse.json({
      success: true,
      deviceTableStructure: deviceTableStructure.rows,
      pairingCodesTableStructure: pairingCodesTableStructure.rows,
      deviceTriggers: deviceTriggers.rows,
      pairingCodeTriggers: pairingCodeTriggers.rows,
      deviceRegistrationFunction: deviceRegistrationFunction.rows,
      testResults: {
        deviceInsert: testInsertResult,
        pairingCodeInsert: testPairingCodeResult,
      },
    })
  } catch (error) {
    console.error("Error in debug-device-registration:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
