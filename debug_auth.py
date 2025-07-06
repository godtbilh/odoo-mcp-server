import os
import xmlrpc.client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ODOO_URL = os.getenv("ODOO_URL")
ODOO_API_KEY = os.getenv("ODOO_API_KEY")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USERNAME = os.getenv("ODOO_USERNAME", "admin")

def debug_authentication():
    """Debug authentication issues with Odoo."""
    print("🔍 Debugging Odoo Authentication...")
    print(f"URL: {ODOO_URL}")
    print(f"Database: {ODOO_DB}")
    print(f"Username: {ODOO_USERNAME}")
    print(f"API Key: {ODOO_API_KEY[:10]}...{ODOO_API_KEY[-4:]}" if ODOO_API_KEY else "No API Key")
    print("-" * 60)
    
    try:
        # Test connection
        print("1. Testing connection...")
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        version = common.version()
        print(f"✅ Connected successfully!")
        print(f"   Server version: {version.get('server_version', 'Unknown')}")
        print(f"   Protocol version: {version.get('protocol_version', 'Unknown')}")
        
        # Try different authentication approaches
        print("\n2. Testing authentication methods...")
        
        # Method 1: Standard authentication
        print("   Method 1: Standard authentication with username/API key...")
        try:
            uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {})
            if uid:
                print(f"   ✅ Success! User ID: {uid}")
                return uid
            else:
                print("   ❌ Failed - returned False/None")
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
        
        # Method 2: Try with different common usernames
        common_usernames = ['admin', 'Administrator', 'user', 'demo']
        print(f"\n   Method 2: Trying common usernames...")
        for username in common_usernames:
            if username == ODOO_USERNAME:
                continue  # Already tried
            print(f"   Trying username: {username}")
            try:
                uid = common.authenticate(ODOO_DB, username, ODOO_API_KEY, {})
                if uid:
                    print(f"   ✅ Success with username '{username}'! User ID: {uid}")
                    print(f"   💡 Update your .env file: ODOO_USERNAME={username}")
                    return uid
                else:
                    print(f"   ❌ Failed with username '{username}'")
            except Exception as e:
                print(f"   ❌ Exception with '{username}': {str(e)}")
        
        # Method 3: Check if it's an API key issue
        print(f"\n   Method 3: API Key validation...")
        if not ODOO_API_KEY:
            print("   ❌ No API key found in environment variables")
        elif len(ODOO_API_KEY) < 20:
            print("   ⚠️  API key seems too short (might be incomplete)")
        elif len(ODOO_API_KEY) > 100:
            print("   ⚠️  API key seems too long (might be malformed)")
        else:
            print(f"   ✅ API key length looks reasonable ({len(ODOO_API_KEY)} characters)")
        
        # Method 4: Try to get database list
        print(f"\n   Method 4: Checking database availability...")
        try:
            db_list = common.list()
            print(f"   Available databases: {db_list}")
            if ODOO_DB in db_list:
                print(f"   ✅ Database '{ODOO_DB}' is available")
            else:
                print(f"   ❌ Database '{ODOO_DB}' not found in available databases")
                print(f"   💡 Available options: {db_list}")
        except Exception as e:
            print(f"   ❌ Could not get database list: {str(e)}")
        
        print("\n" + "=" * 60)
        print("🚨 AUTHENTICATION FAILED")
        print("=" * 60)
        print("Possible issues:")
        print("1. API Key is incorrect or expired")
        print("2. Username doesn't match the API key owner")
        print("3. Database name is incorrect")
        print("4. User doesn't have XML-RPC access permissions")
        print("5. API key was generated for a different user")
        print("\n💡 To fix this:")
        print("1. Go to your Odoo instance")
        print("2. Navigate to Settings > Users & Companies > Users")
        print("3. Find your user and check the login name")
        print("4. Generate a new API key if needed")
        print("5. Make sure XML-RPC is enabled for your user")
        
        return None
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return None

if __name__ == "__main__":
    debug_authentication()
