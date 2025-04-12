export interface LeaderboardEntry {
    id: string;
    name: string;
    department: string;
    rating: number;
    activeDomains: string[];
  }
  export type Status = "OPEN" | "IN PROGRESS" | "CLOSED";
  export type DifficultyTag = "INTERMEDIATE" | "BEGINNER" | "ADVANCED";
  export type Role ="USER"|  "PROFESSOR"| "ADMIN";
  export type ApplicationStatus =
    "PENDING"|
    "ACCEPTED"|
    "REJECTED"

  
   export interface Subtask {
    id          :string  
    title       :string
    description :string
    status      :Status    
    deadline    :string
    projectId   :string    
    project     :Project   
}

   export interface Project {
      id              :   string        
    authorId          : string         
    title             : string
    subheading        : string
    description       : string
    status            : Status          
    deadlineToApply   :string
    deadlineToComplete :string
    difficultyTag     : DifficultyTag
    applicantCapacity :number             
    selectionCapacity : number            
    requirementTags   : string[]
    projectResources  : JSON[]
    subtasks           :Subtask[]        
    createdAt         : string       
    updatedAt         : string       
    applications      : Application[]
    author            : User            
    members           : ProjectMember[]
    }

    export interface Application {
    id               : string            
    projectId        : string            
    applicantId      : string            
    dateOfApplication: string       
    status           : ApplicationStatus 
    applicant        : User              
    project           :Project           }
    export interface User {
    id               :       string         
    username          :       string          
    name              :       string
    roll              :       string       
    email             :       string         
    password          :       string
    role              :       Role            
    rating            :       number             
    degree            :       string
    year              :       string
    branch            :       string
    department        :       string
    picture           :       string
    accountCreatedAt   :      string        
    passwordChangedAt   :     string
    passwordResetToken    :   string
    passwordResetTokenExpiry: string
    applications      :       Application[]
    projectCreated       :    Project[]       
    projectsParticipated  :   ProjectMember[]
}

     export interface ProjectMember {
    id    : string  
    projectId :string  
    userId :  string 
    project :  Project 
    user     : User  
    }