import path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import {
  PythonFunction,
  PythonLayerVersion,
} from './uv-python-lambda.construct';

// const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

export type CdkAppStackProps = cdk.StackProps & {
  usingDocker?: boolean;
};

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CdkAppStackProps) {
    super(scope, id, props);

    new PythonFunction(this, 'python-lambda', {
      functionName: 'hello-world-function',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      entry: path.join(__dirname, '../python-lambda/hello-world'),
      architecture: lambda.Architecture.X86_64,
      tracing: lambda.Tracing.ACTIVE,
      build: {
        image: props?.usingDocker
          ? cdk.DockerImage.fromBuild(
              path.join(__dirname, '../python-lambda/hello-world'),
            )
          : undefined,
      },
    });

    const dependenciesLayer = new PythonLayerVersion(this, 'PythonLayer', {
      layerVersionName: 'python-dependencies-layer-example',
      entry: path.join(__dirname, '../python-lambda/hello-world-with-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      compatibleArchitectures: [lambda.Architecture.X86_64],
      build: {
        image: props?.usingDocker
          ? cdk.DockerImage.fromBuild(
              path.join(__dirname, '../python-lambda/hello-world-with-layer'),
              { file: 'dependencies-layer.Dockerfile' },
            )
          : undefined,
      },
    });

    new lambda.Function(this, 'python-lambda-with-layer', {
      functionName: 'hello-world-function-with-layer',
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
            'uv.lock',
            'pyproject.toml',
            '.venv',
            '.gitignore',
          ],
        },
      ),
      layers: [dependenciesLayer],
      architecture: lambda.Architecture.X86_64,
      tracing: lambda.Tracing.ACTIVE,
    });
  }
}
