import React from "react";

import ValuesQuerySelect from "@/components/shared/values-query-select";
import { ExtInputProps } from "@/components/ui/ext-form";
import { getTimezones, TimezoneInfo } from "@/lib/actions/shared.action";
import { UiAttributes } from "@/types/ui-components";

const TimezoneSelect = ({
  form,
  fieldName,
  label,
  placeholder,
  required,
}: ExtInputProps & UiAttributes) => {
  return (
    <ValuesQuerySelect<TimezoneInfo>
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
