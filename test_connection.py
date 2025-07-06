import os
import xmlrpc.client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ODOO_URL = os.getenv("ODOO_URL")
ODOO_API_KEY = os.getenv("ODOO_API_KEY")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USERNAME = os.getenv("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD")

def test_odoo_connection():
    """Test connection to Odoo instance."""
    print("Testing Odoo connection...")
    print(f"URL: {ODOO_URL}")
    print(f"Database: {ODOO_DB}")
    print(f"API Key: {ODOO_API_KEY[:10]}..." if ODOO_API_KEY else "No API Key")
    print("-" * 50)
    
    try:
        # Test connection with common endpoint
        print("1. Testing common endpoint...")
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        version = common.version()
        print(f"✅ Connected to Odoo version: {version}")
        
        # Authenticate - try both methods
        print("2. Testing authentication...")
        uid = None
        
        # Try API key first
        if ODOO_API_KEY:
            print("   Trying API key authentication...")
            try:
                uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {})
                if uid:
                    print(f"   ✅ API key authentication successful! User ID: {uid}")
                else:
                    print("   ❌ API key authentication failed")
            except Exception as e:
                print(f"   ❌ API key authentication error: {str(e)}")
        
        # Try password if API key failed
        if not uid and ODOO_PASSWORD:
            print("   Trying password authentication...")
            try:
                uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
                if uid:
                    print(f"   ✅ Password authentication successful! User ID: {uid}")
                    # Update the credential to use for data access
                    auth_credential = ODOO_PASSWORD
                else:
                    print("   ❌ Password authentication failed")
            except Exception as e:
                print(f"   ❌ Password authentication error: {str(e)}")
        else:
            auth_credential = ODOO_API_KEY
        
        if not uid:
            print("❌ All authentication methods failed")
            return False
        
        print(f"✅ Authentication successful! User ID: {uid}")
        
        # Get models proxy and test a simple query
        print("3. Testing data access...")
        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
        
        # Try to read user info
        user_info = models.execute_kw(
            ODOO_DB, uid, auth_credential,
            'res.users', 'read',
            [uid],
            {'fields': ['name', 'login']}
        )
        
        if user_info:
            print(f"✅ Data access successful!")
            print(f"   User: {user_info[0].get('name', 'Unknown')}")
            print(f"   Login: {user_info[0].get('login', 'Unknown')}")
        
        # Test searching for partners (customers)
        print("4. Testing search functionality...")
        partner_ids = models.execute_kw(
            ODOO_DB, uid, auth_credential,
            'res.partner', 'search',
            [[]],
            {'limit': 5}
        )
        
        if partner_ids:
            partners = models.execute_kw(
                ODOO_DB, uid, auth_credential,
                'res.partner', 'read',
                [partner_ids],
                {'fields': ['name', 'email']}
            )
            print(f"✅ Found {len(partners)} partners:")
            for partner in partners[:3]:  # Show first 3
                print(f"   - {partner.get('name', 'No name')} ({partner.get('email', 'No email')})")
        
        print("-" * 50)
        print("🎉 All tests passed! Your Odoo MCP server should work correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        print("-" * 50)
        print("💡 Troubleshooting tips:")
        print("1. Check your ODOO_URL is correct and accessible")
        print("2. Verify your ODOO_API_KEY is valid")
        print("3. Ensure your ODOO_DB name is correct")
        print("4. Make sure your Odoo instance allows XML-RPC connections")
        return False

if __name__ == "__main__":
    test_odoo_connection()
