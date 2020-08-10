import React from 'react';
import { SunburstChart } from './components/SunburstChart/SunburstChart';
import { ApiService } from './services/ApiService';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { MasterDetailModule } from '@ag-grid-enterprise/master-detail';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-alpine.css'
import './App.scss';

class App extends React.Component {
  constructor() {
    super();
    
    this.modules = [
      ClientSideRowModelModule,
      MasterDetailModule,
      MenuModule,
      ColumnsToolPanelModule,
    ];
    
    this.state = {
      config: {
        data: {
          children:[
          ], 
          name: "Hosts"
        }
      },
      rows: [],
    };

    this.defaultColDef = {
      // flex: 1,
      // minWidth: 200,
      resizable: true,
    };

    this.detailCellRendererParams = {
      detailGridOptions: {
        columnDefs: [
          { field: 'web_node' },
          { field: 'status_code' },
          { field: 'status_text' },
        ]
      },
      getDetailRowData: function(params) {
        params.successCallback(params.data.nodes);
      },
    };

    this.columnDefs = [
      {
        headerName: 'Host Id',
        field: 'host',
        valueFormatter: this.extractHostData('id'),
        cellRenderer: 'agGroupCellRenderer',
      },
      {
        field: 'status_code',
      },
      {
        field: 'status_text',
      },
      {
        field: 'total_alerts',
      },
      {
        field: 'requested_at',
      },
      {
        field: 'completed_at',
      },
     
      {
        headerName: 'auth_schema_jwt',
        field: 'host',
        valueFormatter: this.extractHostData('auth_schema_jwt')
      },
      {
        headerName: 'auth_schema_oauth2',
        field: 'host',
        valueFormatter: this.extractHostData('auth_schema_oauth2')
      },
      {
        headerName: 'block_guest_access',
        field: 'host',
        valueFormatter: this.extractHostData('block_guest_access')
      },
      {
        headerName: 'downstream_host',
        field: 'host',
        valueFormatter: this.extractHostData('downstream_host')
      },
      {
        headerName: 'downstream_port',
        field: 'host',
        valueFormatter: this.extractHostData('downstream_port')
      },
      {
        headerName: 'downstream_protocol',
        field: 'host',
        valueFormatter: this.extractHostData('downstream_protocol')
      },
      {
        headerName: 'enabled',
        field: 'host',
        valueFormatter: this.extractHostData('enabled')
      },
      {
        headerName: 'name',
        field: 'host',
        valueFormatter: this.extractHostData('name')
      },
      {
        headerName: 'options',
        field: 'host',
        width: 530,
        valueFormatter: this.extractHostData('options')
      },
      {
        headerName: 'upstream_host',
        field: 'host',
        valueFormatter: this.extractHostData('upstream_host')
      },
      {
        headerName: 'upstream_port',
        field: 'host',
        valueFormatter: this.extractHostData('upstream_port')
      },
      {
        headerName: 'upstream_protocol',
        field: 'host',
        valueFormatter: this.extractHostData('upstream_protocol')
      },
    ]
  }

  componentDidMount() {
    this.fetchStatusReport();
  }

  extractHostData(key) {
    return (params) => {
      return typeof params.value[key] === 'object' ? JSON.stringify(params.value[key]) : params.value[key];  
    }
  }

  fetchStatusReport() {
    this.initData();
    
    ApiService.getStatusReport().then(resp => {
      console.log('rep', resp);
      resp.service_reports.forEach(r => {
        this.all.push(r);

        if (r.total_alerts > 0) {
          this.unHealthyHosts.push(r);
        } else {
          this.healthyHosts.push(r)
        }
      });
    })
    .catch(console.error)
    .finally(() => {
      this.setState({
        config: {
          data: {
            children: [
              {
                name: 'Healthy Hosts',
                size: this.healthyHosts.length,
                color: 'green',
              },
              {
                name: 'Unhealthy Hosts',
                size: this.unHealthyHosts.length,
                color: 'red',
              }
            ],
            name: 'Hosts'
          }
        },
        rows: this.all,
      })
    });
  }

  initData() {
    this.all = [];
    this.healthyHosts = [];
    this.unHealthyHosts = [];
  }

  onFilter = (d) => {
    if (d.data.name === 'Healthy Hosts') {
      this.setState({
        rows: this.healthyHosts,
      });
    } else if (d.data.name === 'Unhealthy Hosts') {
      this.setState({
        rows: this.unHealthyHosts,
      });
    } else {
      this.setState({
        rows: this.all,
      });
    }
  }
  
  render() {
    return (
      <div className='App'>
        <div className='chart-container'>
          <SunburstChart config={this.state.config} onFilter={this.onFilter}/>
        </div>

        <div className='grid-container ag-theme-alpine'>
          <AgGridReact
            modules={this.modules}
            defaultColDef={this.defaultColDef}
            columnDefs={this.columnDefs}
            masterDetail={true}
            detailCellRendererParams={this.detailCellRendererParams}
            rowData={this.state.rows}
          >
          </AgGridReact>
        </div>
      </div>
    );
  }
}

export default App;
