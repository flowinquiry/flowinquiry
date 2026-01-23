"use client";

import {
  ArrowUpDown,
  CalendarIcon,
  CheckCircle,
  ChevronDown,
  Clock,
  FilterIcon,
  Inbox,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  getPriorityClassNames,
  PRIORITIES_ORDERED,
  PRIORITY_CODES,
  PRIORITY_CONFIG,
} from "@/lib/constants/ticket-priorities";
import { Filter, GroupFilter, QueryDTO } from "@/types/query";
import { TicketPriority } from "@/types/tickets";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface StatusIcons {
  [key: string]: React.ReactNode;
}

interface TicketAdvancedSearchProps {
  searchText?: string;
  setSearchText: (text: string) => void;
  statuses?: string[];
  setStatuses: (statuses: string[]) => void;
  isAscending: boolean;
  setIsAscending: (isAscending: boolean) => void;
  onFilterChange?: (query: QueryDTO) => void;
}

const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

const TicketAdvancedSearch: React.FC<TicketAdvancedSearchProps> = ({
  searchText = "",
  setSearchText,
  statuses = [],
  setStatuses,
  isAscending,
  setIsAscending,
  onFilterChange = () => {},
}) => {
  const t = useAppClientTranslations();
  const [priority, setPriority] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [activeFilterCount, setActiveFilterCount] = useState<number>(
    statuses?.length || 0,
  );

  // Add internal search state for immediate input update
  const [internalSearchText, setInternalSearchText] =
    useState<string>(searchText);

  // Add debounce timer reference
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { data: session } = useSession();

  const statusIcons: StatusIcons = {
    New: <Clock className="h-4 w-4" />,
    Assigned: <UserCheck className="h-4 w-4" />,
    Completed: <CheckCircle className="h-4 w-4" />,
  };

  // Format date without external dependencies
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Format date range for display
  const formatDateRange = (): string => {
    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    } else if (dateRange.from) {
      return `From ${formatDate(dateRange.from)}`;
    } else if (dateRange.to) {
      return `Until ${formatDate(dateRange.to)}`;
    }
    return "";
  };

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setInternalSearchText(value); // Update the input field immediately

    // Clear any existing timer
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    // Set a new timer - only update the actual search text after 2 seconds of inactivity
    searchDebounceTimer.current = setTimeout(() => {
      setSearchText(value);
    }, 2000);
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // Build and send the initial query when component mounts
    buildQueryDTO();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Update count of active filters and build query
  useEffect(() => {
    let count = 0;
    if (statuses?.length > 0) count += 1;
    if (priority !== "") count += 1;
    if (assignee !== "") count += 1;
    if (dateRange.from || dateRange.to) count += 1;

    setActiveFilterCount(count);

    buildQueryDTO();
  }, [statuses, priority, assignee, dateRange, searchText]);

  // Status toggle handler
  const toggleStatus = (status: string): void => {
    if (!statuses) {
      setStatuses([status]);
      return;
    }

    if (statuses.includes(status)) {
      if (statuses.length === 1) return;
      setStatuses(statuses.filter((s) => s !== status));
    } else {
      setStatuses([...statuses, status]);
    }
  };

  // Clear all filters
  const clearFilters = (): void => {
    setStatuses(["New", "Assigned"]);
    setPriority("");
    setAssignee("");
    setDateRange({ from: undefined, to: undefined });
    setInternalSearchText("");
    setSearchText("");
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
  };

  // Build QueryDTO from all filters
  const buildQueryDTO = (): QueryDTO => {
    const groups: GroupFilter[] = [];

    // Status filters - retain original logic but make it clearer
    if (statuses?.length > 0) {
      const statusFilters: Filter[] = [];
      let includeAssignedStatus = false;

      // Check for New status
      if (statuses.includes("New")) {
        statusFilters.push({
          field: "isNew",
          operator: "eq",
          value: true,
        });
      }

      // Check for Completed status
      if (statuses.includes("Completed")) {
        statusFilters.push({
          field: "isCompleted",
          operator: "eq",
          value: true,
        });
      }

      // Check for Assigned status
      if (statuses.includes("Assigned")) {
        includeAssignedStatus = true;
      }

      // Create the status group
      const statusGroup: GroupFilter = {
        filters: statusFilters,
        groups: [],
        logicalOperator: "OR",
      };

      // If Assigned is selected, use a safer approach to add the assigned condition
      if (includeAssignedStatus) {
        statusGroup.groups = statusGroup.groups || [];
        statusGroup.groups.push({
          logicalOperator: "AND",
          filters: [
            { field: "isCompleted", operator: "eq", value: false },
            { field: "isNew", operator: "eq", value: false },
          ],
          groups: [],
        });
      }

      groups.push(statusGroup);
    }

    // Priority filter
    if (priority !== "") {
      const priorityKey = priority as TicketPriority;
      if (priorityKey in PRIORITY_CODES) {
        groups.push({
          filters: [
            {
              field: "priority",
              operator: "eq",
              value: PRIORITY_CODES[priorityKey],
            },
          ],
          groups: [],
          logicalOperator: "AND",
        });
      }
    }

    // Assignee filter
    if (assignee !== "") {
      if (assignee === "me") {
        groups.push({
          filters: [
            {
              field: "assignUser.id",
              operator: "eq",
              value: session?.user?.id,
            },
          ],
          groups: [],
          logicalOperator: "AND",
        });
      }
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      const dateFilters: Filter[] = [];

      if (dateRange.from) {
        dateFilters.push({
          field: "createdAt",
          operator: "gt",
          value: dateRange.from.toISOString(),
        });
      }

      if (dateRange.to) {
        dateFilters.push({
          field: "createdAt",
          operator: "lt",
          value: dateRange.to.toISOString(),
        });
      }

      groups.push({
        filters: dateFilters,
        groups: [],
        logicalOperator: "AND",
      });
    }

    // Search text filter
    if (searchText?.trim()) {
      groups.push({
        filters: [
          {
            field: "requestTitle",
            operator: "lk",
            value: `%${searchText}%`,
          },
          {
            field: "requestDescription",
            operator: "lk",
            value: `%${searchText}%`,
          },
        ],
        groups: [],
        logicalOperator: "OR",
      });
    }

    const queryDTO: QueryDTO = {
      groups,
    };

    onFilterChange(queryDTO);
    return queryDTO;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border shadow-xs">
      <div className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search input with icon */}
          <div className="relative grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder={t.teams.tickets.list("search_place_holder")}
              value={internalSearchText}
              onChange={handleSearch}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex md:flex-row gap-2">
            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  <span>{t.teams.tickets.list("filters")}</span>
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={statuses?.includes("New")}
                  onCheckedChange={() => toggleStatus("New")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  New
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statuses?.includes("Assigned")}
                  onCheckedChange={() => toggleStatus("Assigned")}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Assigned
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statuses?.includes("Completed")}
                  onCheckedChange={() => toggleStatus("Completed")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={priority}
                  onValueChange={setPriority}
                >
                  <DropdownMenuRadioItem value="">
                    Any Priority
                  </DropdownMenuRadioItem>
                  {/* Map through priorities from shared constants */}
                  {PRIORITIES_ORDERED.map((priorityKey) => (
                    <DropdownMenuRadioItem
                      key={priorityKey}
                      value={priorityKey}
                    >
                      <span className={PRIORITY_CONFIG[priorityKey].iconColor}>
                        {PRIORITY_CONFIG[priorityKey].icon}
                      </span>
                      <span className="ml-2">{priorityKey}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Assignee</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={assignee}
                  onValueChange={setAssignee}
                >
                  <DropdownMenuRadioItem value="">Anyone</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="me">
                    <User className="mr-2 h-4 w-4" />
                    Assigned to me
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Created Date</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={classNames(
                          "w-full justify-start text-left font-normal",
                          dateRange.from || dateRange.to ? "text-primary" : "",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from || dateRange.to ? (
                          formatDateRange()
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          });
                        }}
                        initialFocus
                      />
                      <div className="flex items-center gap-2 p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({ from: undefined, to: undefined })
                          }
                          className="ml-auto"
                        >
                          Clear
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort dropdown as a separate control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>{t.teams.tickets.list("sort")}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={isAscending ? "asc" : "desc"}
                  onValueChange={(val) => setIsAscending(val === "asc")}
                >
                  <DropdownMenuRadioItem value="desc">
                    {t.teams.tickets.list("newest_first")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="asc">
                    {t.teams.tickets.list("oldest_first")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {(statuses?.length > 0 ||
        priority !== "" ||
        assignee !== "" ||
        dateRange.from ||
        dateRange.to) && (
        <div className="px-4 pb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Active filters:
          </span>

          {/* Status filters */}
          {statuses?.map((status) => (
            <Badge
              key={status}
              variant="default"
              className="flex items-center gap-1"
            >
              {statusIcons[status]}
              {status}
              <button onClick={() => toggleStatus(status)} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* Priority filter - Updated to use shared utilities */}
          {priority && (
            <Badge
              variant="secondary"
              className={classNames(
                "flex items-center gap-1",
                getPriorityClassNames(priority as TicketPriority),
              )}
            >
              <span
                className={
                  PRIORITY_CONFIG[priority as TicketPriority].iconColor
                }
              >
                {PRIORITY_CONFIG[priority as TicketPriority].icon}
              </span>
              {priority}
              <button onClick={() => setPriority("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Assignee filter */}
          {assignee && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {assignee === "me" ? (
                <User className="h-4 w-4" />
              ) : (
                <Inbox className="h-4 w-4" />
              )}
              {assignee === "me" ? "Assigned to me" : "Unassigned"}
              <button onClick={() => setAssignee("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Date range filter */}
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {formatDateRange()}
              <button
                onClick={() => setDateRange({ from: undefined, to: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Clear all button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-7"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketAdvancedSearch;
