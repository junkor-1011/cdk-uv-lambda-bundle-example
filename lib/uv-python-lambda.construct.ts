import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

import { AssetHashType, DockerImage, aws_lambda as lambda } from 'aws-cdk-lib';

import type { Construct } from 'constructs';

type OmitKey = 'code';
export type PythonFunctionProps = Omit<lambda.FunctionProps, OmitKey> & {
  readonly entry: string;
  readonly build?: {
    readonly image?: DockerImage;
  };
};

export class PythonFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props: PythonFunctionProps) {
    if (props.runtime && props.runtime.family !== lambda.RuntimeFamily.PYTHON) {
      throw new Error('Only `PYTHON` runtimes are supported.');
    }

    super(scope, id, {
      ...props,
      code: new lambda.AssetCode(props.entry, {
        assetHashType: AssetHashType.OUTPUT,
        bundling: {
          image: props?.build?.image ?? DockerImage.fromRegistry('dummy'),
          local: {
            tryBundle: (outputDir, _options): boolean => {
              const originalDir = process.cwd();
              const tmpRequirementsTxtPath = `/tmp/requirements-${randomUUID()}.txt`;

              process.chdir(props.entry);

              fs.cpSync(props.entry, outputDir, {
                recursive: true,
                filter: (source, _destination): boolean => {
                  if (source.includes('.venv/')) return false;
                  if (source.includes('.gitignore')) return false;
                  if (source.includes('uv.lock')) return false;

                  return true;
                },
              });

              execSync(
                `uv export --no-dev --frozen --no-editable --output-file ${tmpRequirementsTxtPath}`,
              );
              execSync('uv venv');

              execSync(
                `uv pip install -r ${tmpRequirementsTxtPath} --target ${outputDir} --quiet`,
              );

              fs.rmSync(tmpRequirementsTxtPath);

              process.chdir(originalDir);
              return true;
            },
          },
        },
      }),
    });
  }
}

export type PythonLayerVersionProps = Omit<
  lambda.LayerVersionProps,
  OmitKey
> & {
  readonly entry: string;
  readonly build?: {
    readonly image?: DockerImage;
  };
};

export class PythonLayerVersion extends lambda.LayerVersion {
  constructor(scope: Construct, id: string, props: PythonLayerVersionProps) {
    super(scope, id, {
      ...props,
      code: new lambda.AssetCode(props.entry, {
        assetHashType: AssetHashType.OUTPUT,
        bundling: {
          image: props?.build?.image ?? DockerImage.fromRegistry('dummy'),
          local: {
            tryBundle: (outputDir, _options): boolean => {
              const originalDir = process.cwd();
              const tmpRequirementsTxtPath = `/tmp/requirements-${randomUUID()}.txt`;

              process.chdir(props.entry);

              execSync(
                `uv export --no-dev --frozen --no-editable --output-file ${tmpRequirementsTxtPath}`,
              );
              execSync('uv venv');
              execSync(
                `uv pip install -r ${tmpRequirementsTxtPath} --target ${outputDir}/python --quiet`,
              );

              fs.rmSync(tmpRequirementsTxtPath);

              process.chdir(originalDir);
              return true;
            },
          },
        },
      }),
    });
  }
}
