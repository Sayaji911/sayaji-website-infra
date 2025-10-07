# Personal Website Infrastructure

This project contains the AWS CDK infrastructure code for deploying multiple website stacks including a resume site, blog, and homepage. It uses TypeScript for infrastructure definition and Python for Lambda functions.

## Architecture

- **Base Infrastructure Stack**
  - Route53 Hosted Zone
  - ACM Certificates

- **Backend Stack**
  - DynamoDB Table (Visit Counter)
  - Lambda Functions
  - API Gateway
  - Secrets Manager

- **Website Stacks**
  - Resume Site (resume.sayaji.dev)
  - Blog Site (blog.sayaji.dev)
  - Homepage (sayaji.dev)
  - CloudFront Distributions
  - S3 Buckets

## Prerequisites

- Node.js & npm
- AWS CLI configured
- Python 3.10+ (for Lambda functions)
- AWS CDK CLI

```bash
npm install -g aws-cdk
```

## Installation

```bash
# Install dependencies
npm install

# Install Python dependencies for Lambda functions
pip install -r requirements.txt
```

## Development

```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm run test
```

## Deployment

```bash
# Deploy all stacks
npx cdk deploy --all

# Deploy specific stack
npx cdk deploy BackendStack
npx cdk deploy ResumeStack
```

## Testing

```bash
# Run TypeScript tests
npm test

# Run Python Lambda tests
python -m pytest test/
```

## Project Structure

```
.
├── bin/                # CDK app entry point
├── lib/               # Stack definitions
│   └── constructs/    # Reusable CDK constructs
├── lambda_functions/  # Lambda function code
└── test/             # Test files
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Create a pull request

## License

MIT