import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

import { AssetHashType, DockerImage, aws_lambda as lambda } from 'aws-cdk-lib';

import type { Construct } from 'constructs';

interface UVOptions {
  readonly pip?: {
    readonly noCacheDir?: boolean;
  };
  readonly export?: {
    readonly noDev?: boolean;
    readonly group?: readonly string[];
    readonly onlyGroup?: readonly string[];
  };
}

const uvOptionsDefault = {
  pip: {
    noCacheDir: false,
  },
  export: {
    noDev: true,
  },
} as const satisfies UVOptions;

type OmitKey = 'code';
export type PythonFunctionProps = Omit<lambda.FunctionProps, OmitKey> & {
  readonly entry: string;
  readonly uvOptions?: UVOptions;
  readonly build?: {
    readonly image?: DockerImage;
  };
};

export class PythonFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props: PythonFunctionProps) {
    super(scope, id, {
      ...props,
      code: new lambda.AssetCode(props.entry, {
        assetHashType: AssetHashType.OUTPUT,
        bundling: {
          image: props?.build?.image ?? DockerImage.fromRegistry('dummy'),
          local: {
            tryBundle: (outputDir, _options): boolean => {
              const uvOptions = {
                pip: {
                  ...uvOptionsDefault.pip,
                  ...props?.uvOptions?.pip,
                },
                export: {
                  ...uvOptionsDefault.export,
                  ...props?.uvOptions?.export,
                },
              } as const satisfies UVOptions;

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

              const uvExportOptions: string = (() => {
                let opts = '';

                if (uvOptions?.export) {
                  if (uvOptions.export.noDev) {
                    opts = `${opts} --no-dev`;
                  }
                  if (uvOptions.export.group) {
                    for (const g of uvOptions.export.group) {
                      opts += ` --group ${g}`;
                    }
                  }
                  if (uvOptions.export.onlyGroup) {
                    for (const g of uvOptions.export.onlyGroup) {
                      opts += ` --only-group ${g}`;
                    }
                  }
                }

                return opts;
              })();
              execSync(
                `uv export ${uvExportOptions} --frozen --no-editable --output-file ${tmpRequirementsTxtPath}`,
              );
              execSync('uv venv');

              execSync(
                `uv pip install -r ${tmpRequirementsTxtPath} ${uvOptions.pip.noCacheDir ? '--no-cache-dir' : ''} --target ${outputDir} --quiet`,
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
  readonly uvOptions?: UVOptions;
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
              const uvOptions = {
                pip: {
                  ...uvOptionsDefault.pip,
                  ...props?.uvOptions?.pip,
                },
                export: {
                  ...uvOptionsDefault.export,
                  ...props?.uvOptions?.export,
                },
              } as const satisfies UVOptions;

              const originalDir = process.cwd();
              const tmpRequirementsTxtPath = `/tmp/requirements-${randomUUID()}.txt`;

              process.chdir(props.entry);

              const uvExportOptions: string = (() => {
                let opts = '';

                if (uvOptions?.export) {
                  if (uvOptions.export.noDev) {
                    opts = `${opts} --no-dev`;
                  }
                  if (uvOptions.export.group) {
                    for (const g of uvOptions.export.group) {
                      opts += ` --group ${g}`;
                    }
                  }
                  if (uvOptions.export.onlyGroup) {
                    for (const g of uvOptions.export.onlyGroup) {
                      opts += ` --only-group ${g}`;
                    }
                  }
                }

                return opts;
              })();
              execSync(
                `uv export ${uvExportOptions} --frozen --no-editable --output-file ${tmpRequirementsTxtPath}`,
              );
              execSync('uv venv');
              execSync(
                `uv pip install -r ${tmpRequirementsTxtPath} ${uvOptions.pip.noCacheDir ? '--no-cache-dir' : ''} --target ${outputDir}/python --quiet`,
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
