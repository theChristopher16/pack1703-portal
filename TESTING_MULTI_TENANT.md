# Testing Guide: Multi-Tenant Organization Components

## Prerequisites

1. **Ensure you're on the correct branch:**
   ```bash
   git branch --show-current
   # Should show: feature/multi-tenant-org-components
   
   # If not, switch to it:
   git checkout feature/multi-tenant-org-components
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Ensure Firebase is configured:**
   - Make sure `src/firebase/config.ts` is properly configured
   - You should have access to Firestore

## Step 1: Start the Development Server

```bash
npm start
```

This will start the React development server at `http://localhost:3000`

## Step 2: Access the Organizations Page

1. **Login as a Super Admin:**
   - Log in with an account that has `super-admin` or `root` role
   - You should be automatically redirected to `/organizations` when logging in as super admin

2. **Or navigate directly:**
   - Go to: `http://localhost:3000/organizations`
   - If you're not a super admin, you'll be redirected to the homepage

## Step 3: Test Organization Creation

### Test Case 1: Create a Storefront Organization

1. Click **"Create Organization"** button
2. Fill in the form:
   - **Organization Type:** Select "Storefront / Spirit Store"
   - **Name:** `St Francis Spirit Store`
   - **Slug:** `st-francis-spirit-store` (auto-generated from name)
   - **Description:** `Official spirit store for St Francis School`
   - **Active:** ✓ (checked)

3. **Select Components:**
   - **Base Components:** Select at least a few:
     - ✓ Chat
     - ✓ Calendar
     - ✓ Announcements
     - ✓ Locations
   - **Storefront Components:** (should appear because type is Storefront)
     - ✓ Products
     - ✓ Orders
     - ✓ Cart
     - ✓ Checkout

4. Click **"Create Organization"**
5. Verify the organization appears in the grid with:
   - Correct organization type badge
   - Enabled components displayed as badges
   - "Open Portal" button

### Test Case 2: Create a Pack Organization

1. Click **"Create Organization"** again
2. Fill in:
   - **Organization Type:** Select "Cub Scout Pack"
   - **Name:** `Pack 1704`
   - **Slug:** `pack1704`
   - **Description:** `Test pack organization`

3. **Select Components:**
   - Only **Base Components** should be available (no Storefront components)
   - Select: Chat, Calendar, Announcements

4. Create and verify

### Test Case 3: Edit Organization

1. Click the **Edit** button (pencil icon) on any organization
2. Change the organization type from Pack to Storefront
3. Verify that:
   - Selected components are filtered (only compatible ones remain)
   - Storefront components become available
4. Add more components and save
5. Verify changes are reflected in the organization card

## Step 4: Test Organization Routing

### Test Case 4: Navigate to Organization Portal

1. Click **"Open Portal"** on any organization card
2. You should be redirected to: `/{org-slug}/{first-component}`
   - Example: `/st-francis-spirit-store/chat`

3. **Test Direct URL Navigation:**
   - Try: `http://localhost:3000/st-francis-spirit-store/chat`
   - Try: `http://localhost:3000/st-francis-spirit-store/calendar`
   - Try: `http://localhost:3000/st-francis-spirit-store/products`
   - Try: `http://localhost:3000/st-francis-spirit-store/orders`

4. **Test Invalid Component:**
   - If organization doesn't have "locations" enabled, try:
   - `http://localhost:3000/st-francis-spirit-store/locations`
   - Should show "Component Not Available" error

### Test Case 5: Test Pack 1703 Card

1. On the organizations page, find the **Pack 1703** card (special card with border)
2. Click **"Open Portal"**
3. Should navigate to `/` (homepage)
4. Verify you're in the main Pack 1703 app

## Step 5: Test Component Selection Logic

### Test Case 6: Component Filtering

1. Create a new organization
2. Select **"Storefront / Spirit Store"** type
3. Select some base components AND storefront components
4. Change type to **"Cub Scout Pack"**
5. Verify:
   - Storefront components are removed from selection
   - Base components remain selected (if compatible)
6. Change back to Storefront
7. Verify storefront components are available again

### Test Case 7: Validation

1. Try to create an organization without selecting any components
2. The **"Create Organization"** button should be disabled
3. Error message should appear: "Please select at least one component"

## Step 6: Test Search and Filtering

### Test Case 8: Search Functionality

1. Create multiple organizations with different names
2. Use the search bar to filter
3. Test searching by:
   - Organization name
   - Slug
   - Description

## Step 7: Test Firestore Data

### Test Case 9: Verify Data Storage

1. Open Firebase Console → Firestore
2. Navigate to `organizations` collection
3. Verify created organizations have:
   - `orgType` field (e.g., "storefront", "pack")
   - `enabledComponents` array (e.g., ["chat", "calendar", "products"])
   - `slug` field
   - `isActive` boolean

## Step 8: Test Edge Cases

### Test Case 10: Invalid Organization Slug

1. Try navigating to: `http://localhost:3000/nonexistent-org/chat`
2. Should show "Organization Not Found" error
3. Should have button to go back to organizations page

### Test Case 11: Inactive Organization

1. Create an organization
2. Edit it and uncheck "Active"
3. Save
4. Try to navigate to its portal
5. Should show "Organization is not active" error

### Test Case 12: Organization with No Components

1. This shouldn't be possible (validation prevents it)
2. But if you manually edit Firestore to remove all components:
   - Navigate to organization root: `/{org-slug}`
   - Should show "Welcome to {org name}" with message about no components

## Step 9: Test Storefront Components

### Test Case 13: Storefront Pages

1. Navigate to a storefront organization
2. Test each storefront component:
   - `/products` - Should show placeholder "Products page coming soon..."
   - `/orders` - Should show placeholder "Orders page coming soon..."
   - `/cart` - Should show placeholder "Shopping Cart page coming soon..."
   - `/checkout` - Should show placeholder "Checkout page coming soon..."

## Step 10: Test Component Mapping

### Test Case 14: Component Rendering

1. Navigate to each enabled component:
   - `/chat` → Should show UnifiedChat component
   - `/calendar` → Should show EventsPage
   - `/announcements` → Should show UnifiedAnnouncementsPage
   - `/locations` → Should show LocationsPage
   - `/resources` → Should show ResourcesPage
   - `/profile` → Should redirect to `/profile`

## Troubleshooting

### Issue: "Organization not found" even after creating

**Solution:**
- Check browser console for errors
- Verify Firestore rules allow read access
- Check network tab to see if Firestore query is failing

### Issue: Components not showing in selection

**Solution:**
- Check browser console for errors
- Verify `src/types/organization.ts` is properly imported
- Check that `getAvailableComponents()` is working correctly

### Issue: Routing not working

**Solution:**
- Check that route is placed before catch-all `*` route in `App.tsx`
- Verify `OrganizationRouter` component is imported correctly
- Check browser console for React Router errors

### Issue: Can't access `/organizations` page

**Solution:**
- Verify you're logged in as super-admin or root
- Check `AuthGuard` redirect logic
- Verify role is set correctly in AdminContext

## Quick Test Checklist

- [ ] Can access `/organizations` page as super admin
- [ ] Pack 1703 card appears and links to homepage
- [ ] Can create Storefront organization with storefront components
- [ ] Can create Pack organization with only base components
- [ ] Can edit organization and change components
- [ ] Can navigate to organization portal: `/{org-slug}/{component}`
- [ ] Invalid component shows error message
- [ ] Invalid organization shows error message
- [ ] Component selection filters correctly when changing org type
- [ ] Validation prevents creating org without components
- [ ] Search filters organizations correctly
- [ ] Organization data saved correctly in Firestore
- [ ] All enabled components are accessible via routing

## Next Steps After Testing

Once you've verified everything works:

1. **Implement Storefront Components:**
   - Replace placeholder pages with actual product/order/cart/checkout functionality

2. **Add Organization Context:**
   - Create context provider to share organization data across components
   - Update components to be organization-aware

3. **Update Navigation:**
   - Make navigation menu show organization-specific components
   - Add organization switcher in header

4. **Add Data Isolation:**
   - Ensure each organization's data is isolated
   - Update Firestore queries to filter by organization

