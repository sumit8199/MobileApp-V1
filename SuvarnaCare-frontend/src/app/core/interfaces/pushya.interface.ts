export interface PushyaDate {
  date: string;
  stage1Date: string;
  stage2Date: string;
  label?: string;
  isPast?: boolean;
  isToday?: boolean;
}

export interface PushyaCalendarDay {
  date: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface PushyaHighlight {
  date: string;
  textColor: string;
  backgroundColor: string;
}
