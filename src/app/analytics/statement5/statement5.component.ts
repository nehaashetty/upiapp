import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../analytics.service';
import { AuthService } from 'src/app/auth/auth.service';
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';
import { ChartSelectEvent } from 'ng2-google-charts';


@Component({
  selector: 'app-statement5',
  templateUrl: './statement5.component.html',
  styleUrls: ['./statement5.component.css']
})
export class Statement5Component implements OnInit {
  academicYears: string[] = [];
  termnumbers: [] = [];
  attendance_details = [];
  departments: String[] = [];
  selectedDepatment: string;
  userRoles: String[] = [];
  public firstLevelChart: GoogleChartInterface;
  title: string;
  error_message: string
  error_flag: boolean = true;
  chart_visibility = false;
  terms;
  courseCode;
  faculties: any;
  selectedyear;
  empID:string="";
  email:any="";
  event:any;
  usn: String = "";
  user_info;
  selectedSubject;
  showSpinner: boolean;
  placementOn =false;
  offers:any[] = [];
  attDetails:any[];
  facultyChart:GoogleChartInterface;

  constructor(private analyticsService: AnalyticsService, private authService: AuthService) { }

  ngOnInit() {
    this.email=localStorage.getItem("user");
    let user = JSON.parse(this.email)
    this.userRoles = user.roles;
    this.email = user.user
    this.get_academic_years()
    this.get_term_numbers()

    if (this.userRoles.includes("STUDENT")) {
      this.analyticsService.get_usn_by_email(this.email).subscribe(res => {
        this.usn = res["usn"];
        console.log(this.usn)
      })
    } else {
      this.analyticsService.get_empid(this.email).subscribe(res => {
        this.empID = res["empid"];
        console.log("EMPID", this.empID)
      })
    }
    if (this.userRoles.includes("PRINCIPAL")) {
      this.analyticsService.get_depts().subscribe(res => {
        this.departments = res["depts"]
      })
    }


  }
  get_academic_years() {
    this.analyticsService.get_academic_years().subscribe(res => {
      this.academicYears = res['acdemicYear']
    })
  }

  get_term_numbers() {
    this.analyticsService.get_term_details().subscribe(res => {
      this.termnumbers = res['term_numbers']
    })
  }

  searchbutton() {
    if (this.userRoles.includes("STUDENT")) {
      if (!this.placementOn) {
        this.getPlacementrDetails()
      }
      this.showSpinner = true;
    this.analyticsService.get_attendance_details(this.usn,this.selectedyear, this.terms).subscribe(res => {
      this.attendance_details = res['attendance_percent']
      this.attendace_data(this.attendance_details)
    })
    }
    else if (this.userRoles.includes("PRINCIPAL")) {
      this.analyticsService.get_dept_faculties(this.selectedDepatment).subscribe(res => {
        let f = res["faculties"]
        console.log(f)
        let data = []
        for (let a of f) {
          data.push(a)
        }
        this.faculties = data
      })
      console.log(this.faculties)
    }
    else if (this.userRoles.includes("HOD")) {
      //see the department and get emps
      let str = this.empID;
      let patt = new RegExp("[a-zA-Z]*");
      let res = patt.exec(str);
      this.selectedDepatment = res[0];
      this.analyticsService.get_dept_faculties(this.selectedDepatment).subscribe(res => {
        let f = res["faculties"]
        console.log(f)
        let data = []
        for (let a of f) {
          data.push(a)
        }
        this.faculties = data
      })
      console.log(this.faculties)
    }
    else if (this.userRoles.includes("FACULTY")) {
      //just load his data
      this.getEmpChart(this.empID)
    }
    }


    
  getPlacementrDetails(){
    this.placementOn = true;
    this.analyticsService.get_offer_by_usn(this.selectedyear,this.usn).subscribe(res =>{
      let re = res["offers"];
        for(let r of re)
        {
          this.offers.push([r['companyName'],r['salary']])
        }
    })
  }
  attendace_data(data) {
    let dataTable = []
    dataTable.push([
      "courseName",
      "Attendance %", { type: 'string', role: 'tooltip' }
    ]);
    for (let i = 0; i < data.length; i += 1) {
      dataTable.push([data[i]['courseName'],
       data[i]['attendance_per'],"Attendance % : " + data[i]['attendance_per']])
    }
    if (dataTable.length > 1) {
      this.chart_visibility = true
      this.error_flag = false
      this.graph_data(dataTable)
    }
    else {
      this.error_flag = true
      this.error_message = "Data doesnot exist for the entered criteria"
    }
  }

  back_() {
    this.chart_visibility = false
  }
  getEmpChart(empid) {
    this.showSpinner=true;
    this.chart_visibility = false;
    let ats;
    let data = [["Subject Name", "Attendance", "Placement"]]
    this.analyticsService.get_attendanceD_byFacSub(empid,this.terms,this.courseCode).subscribe(res => {
      ats = res["attendanceD"]
    },
      err => console.log(err),
      () => {
        for (let am of ats) {
          let temp = 0;
          let placed;
          this.analyticsService.get_emp_placement_of_sub(empid, this.terms, am["courseName"]).subscribe(deet => {
            placed = deet;
            temp = 100 * placed["placedStudents"] / placed["totalStudents"]
            let perc = am["totalPercentage"]/am["peopleCount"]
            console.log(typeof (perc), typeof (temp))
            data.push([am["courseName"], Math.floor(perc), Math.floor(temp)])
          
          })
        }
        if (data.length > 1) {
          this.chart_visibility = true
          this.error_flag = false
          this.graph_data(data)
        }
        else {
          this.error_flag = true
          this.error_message = "Data doesnot exist for the entered criteria"
        }
      })
  
  
    }
    generateFacultyGraph(data) {
      this.facultyChart = {
        chartType: 'ColumnChart',
        dataTable: data,
        options: { title: 'Countries' }
      };
    }



  graph_data(data) {
    this.showSpinner = false
    this.title = 'Course-wise Attendance %',
      this.firstLevelChart = {
        chartType: "ComboChart",
        dataTable: data,
        options: {
          bar: { groupWidth: "20%" },
          vAxis: {
            title: "Attendance %",
          },

          height: 800,
          hAxis: {
            title: "Courses",
            titleTextStyle: {
            }
          },
          chartArea: {
            left: 80,
            right: 100,
            top: 100,
          },
          legend: {
            position: "top",
            alignment: "end"
          },
          seriesType: "bars",
          colors: [ "#2ebf91"],
          fontName: "Times New Roman",
          fontSize: 13,

        }

      }
  }
  second_level(event: ChartSelectEvent) {
    //console.log("Chart Event", event)
    this.selectedSubject = event.selectedRowValues[0]
    this.analyticsService.getAttendanceDetails(this.selectedyear,this.usn,this.terms,this.selectedSubject).subscribe(res=>{
      let allAttendance=res["attendance_d"]
      let data1=[]
      for( let att of allAttendance){
        data1.push([att["courseName"],att["total_classes"],att["present"]])
      }
      this.attDetails=data1
      console.log(this.attDetails)
    })
  }
}
