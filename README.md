# Phone Number Scrubber

A comprehensive application for removing duplicate phone numbers from Excel files and managing Do Not Call (DNC) lists.

## Features

- **Free Phone Number Deduplication**: Upload Excel files and remove duplicate phone numbers
- **Custom Suppression Lists**: Create and manage your own Do Not Call (DNC) lists
- **User Subscriptions**: Pay-per-use and subscription plans
- **Admin Dashboard**: Manage users, payments, banking information, and currencies
- **Payment Processing**: Support for credit card and bank transfer payments

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/phone-scrubber.git
cd phone-scrubber
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Admin Access

To access the admin dashboard:

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Use the following credentials:
   - Username: admin
   - Password: PhoneScrubber2024!

## Project Structure

- `/app`: Next.js App Router pages and layouts
- `/components`: React components
- `/lib`: Utility functions and data services
- `/public`: Static assets

## Technologies Used

- **Next.js**: React framework with App Router
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **ExcelJS**: Excel file processing

## Production Deployment

To build the application for production:

\`\`\`bash
npm run build
# or
yarn build
# or
pnpm build
\`\`\`

Then start the production server:

\`\`\`bash
npm start
# or
yarn start
# or
pnpm start
\`\`\`

## Future Enhancements

- Database integration for persistent storage
- Stripe integration for payment processing
- Team features for shared accounts
- API access for enterprise customers
- Bulk import/export features
- Usage analytics and statistics

## License

MIT
