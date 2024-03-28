import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new lambda.Function(this, 'python-lambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromDockerBuild(
        path.join(__dirname, '../python-lambda/hello-world'),
        { file: 'Dockerfile' },
      ),
    });

    const dependenciesLayer = new lambda.LayerVersion(
      this,
      'LambdaWebAdapter',
      {
        code: lambda.Code.fromDockerBuild(
          path.join(__dirname, '../python-lambda/hello-world-with-layer'),
          {
            file: 'dependencies-layer.Dockerfile',
          },
        ),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
        compatibleArchitectures: [lambda.Architecture.X86_64],
      },
    );

    new lambda.Function(this, 'python-lambda-with-layer', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../python-lambda/hello-world-with-layer'),
        {
          ignoreMode: cdk.IgnoreMode.GIT,
          exclude: [
            '*.Dockerfile',
            '*.md',
            'requirements*',
            'pyproject.toml',
            '.venv',
            '.gitignore',
          ],
        },
      ),
      layers: [dependenciesLayer],
      architecture: lambda.Architecture.X86_64,
    });
  }
}
