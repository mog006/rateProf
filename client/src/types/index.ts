export interface University {
  id: number;
  name: string;
  short_name: string;
  city: string;
  type: 'devlet' | 'vakıf' | 'özel';
  description?: string;
  website?: string;
  logo_color: string;
  num_professors: number;
  num_ratings: number;
  departments?: Department[];
  professors?: Professor[];
}

export interface Department {
  id: number;
  university_id: number;
  name: string;
  short_name?: string;
}

export interface Professor {
  id: number;
  university_id: number;
  department_id?: number;
  name: string;
  title: string;
  avg_rating: number;
  difficulty: number;
  would_take_again: number;
  num_ratings: number;
  university_name?: string;
  university_short?: string;
  department_name?: string;
  logo_color?: string;
  reviews?: Review[];
  courses?: Course[];
  tagStats?: { tag: string; count: number }[];
}

export interface Course {
  id: number;
  university_id: number;
  department_id?: number;
  professor_id?: number;
  code: string;
  name: string;
  credits: number;
  semester?: string;
  year?: number;
  day?: string;
  time_start?: string;
  time_end?: string;
  location?: string;
  professor_name?: string;
  professor_title?: string;
  university_name?: string;
  department_name?: string;
}

export interface Review {
  id: number;
  user_id?: number;
  professor_id: number;
  course_id?: number;
  overall_rating: number;
  difficulty: number;
  would_take_again: number;
  comment: string;
  grade?: string;
  attendance?: string;
  textbook: number;
  created_at: string;
  helpful_count: number;
  not_helpful_count: number;
  user_name?: string;
  is_graduate?: number;
  course_name?: string;
  course_code?: string;
  professor_name?: string;
  university_name?: string;
  tags: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  university_id?: number;
  verified: boolean;
  is_graduate: boolean;
}

export interface SearchResult {
  universities: University[];
  professors: Professor[];
  courses: Course[];
}
