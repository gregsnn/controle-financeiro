interface FormHelpersConfig<
  TForm,
  TItem,
  TPayload,
  TEmptyArgs extends unknown[],
  TEditArgs extends unknown[],
  TBuildArgs extends unknown[],
> {
  createEmptyForm: (...args: TEmptyArgs) => TForm;
  createEditForm: (item: TItem, ...args: TEditArgs) => TForm;
  buildPayload: (form: TForm, ...args: TBuildArgs) => TPayload | null;
}

export function createFormHelpers<
  TForm,
  TItem,
  TPayload,
  TEmptyArgs extends unknown[] = [],
  TEditArgs extends unknown[] = [],
  TBuildArgs extends unknown[] = [],
>(config: FormHelpersConfig<TForm, TItem, TPayload, TEmptyArgs, TEditArgs, TBuildArgs>) {
  return config;
}
