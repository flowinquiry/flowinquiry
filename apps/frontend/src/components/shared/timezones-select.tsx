import React from "react";
import { FieldValues } from "react-hook-form";

import ValuesQuerySelect from "@/components/shared/values-query-select";
import { ExtInputProps } from "@/components/ui/ext-form";
import { getTimezones, TimezoneInfo } from "@/lib/actions/shared.action";
import { UiAttributes } from "@/types/ui-components";

const TimezoneSelect = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  placeholder,
  required,
}: ExtInputProps<T> & UiAttributes) => {
  return (
    <ValuesQuerySelect<TimezoneInfo, T>
      form={form}
      queryName="timezones"
      fieldName={fieldName}
      fieldLabel={label}
      fetchDataFn={getTimezones}
      valueKey="zoneId"
      renderOption={(timezone: TimezoneInfo) =>
        `${timezone.offset} ${timezone.zoneId}`
      }
      required={required}
      placeholder={placeholder}
      noDataMessage="No timezone found"
      searchPlaceholder="Search timezone..."
    />
  );
};

export default TimezoneSelect;
